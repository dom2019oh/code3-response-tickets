import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits, MessageFlags, AttachmentBuilder,
} from 'discord.js';
import {
  ticketTypes, brandColor, transcriptChannelId, isSnowflake, COMMUNITY_NAME,
} from './config.js';
import { nextTicketNumber, ticketName } from './counter.js';

export const TICKET_SELECT_ID = 'ticket_open';
const CLAIM_ID = 'ticket_claim';
const CLOSE_ID = 'ticket_close';
const CLOSE_CONFIRM_ID = 'ticket_close_confirm';
const CLOSE_CANCEL_ID = 'ticket_close_cancel';

// ── topic helpers: ticket metadata is stashed in the channel topic ──────
const TOPIC_PREFIX = 'ticket |';
const buildTopic = ({ type, ownerId, num }) => `${TOPIC_PREFIX} type:${type} | owner:${ownerId} | num:${num}`;
function parseTopic(topic = '') {
  return {
    type: topic.match(/type:(\w+)/)?.[1] ?? null,
    ownerId: topic.match(/owner:(\d+)/)?.[1] ?? null,
    num: topic.match(/num:(\d+)/)?.[1] ?? null,
  };
}

// A channel is a ticket if its topic carries our marker. This works whether or
// not the type is filed under a category, so categories stay optional.
const inTicketChannel = (channel) => !!channel?.topic?.startsWith(TOPIC_PREFIX);

/** Does this member count as staff for the given ticket type? */
function isStaffFor(member, cfg) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  return isSnowflake(cfg?.staffRoleId) && member.roles.cache.has(cfg.staffRoleId);
}

const controlRow = (claimed = false) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(CLAIM_ID).setLabel(claimed ? 'Claimed' : 'Claim')
      .setStyle(ButtonStyle.Success).setDisabled(claimed),
    new ButtonBuilder().setCustomId(CLOSE_ID).setLabel('Close')
      .setStyle(ButtonStyle.Danger),
  );

/** Interaction router — returns true if it handled the interaction. */
export async function handleTicket(interaction) {
  if (interaction.isStringSelectMenu() && interaction.customId === TICKET_SELECT_ID) {
    return openTicket(interaction);
  }
  if (interaction.isButton()) {
    if (interaction.customId === CLAIM_ID) return claimTicket(interaction);
    if (interaction.customId === CLOSE_ID) return promptClose(interaction);
    if (interaction.customId === CLOSE_CONFIRM_ID) return closeTicket(interaction);
    if (interaction.customId === CLOSE_CANCEL_ID) {
      await interaction.update({ content: 'Close cancelled.', embeds: [], components: [] });
      return true;
    }
  }
  return false;
}

// ── open ────────────────────────────────────────────────────────────────
async function openTicket(interaction) {
  const type = interaction.values[0];
  const cfg = ticketTypes[type];
  if (!cfg) {
    await interaction.reply({ content: 'Unknown ticket type.', flags: MessageFlags.Ephemeral });
    return true;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // One open ticket of each type per member.
  const existing = interaction.guild.channels.cache.find((ch) => {
    if (!inTicketChannel(ch)) return false;
    const m = parseTopic(ch.topic ?? '');
    return m.type === type && m.ownerId === interaction.user.id;
  });
  if (existing) {
    await interaction.editReply({ content: `You already have an open **${cfg.label}** ticket: ${existing}.` });
    return true;
  }

  const num = nextTicketNumber();
  const opener = interaction.user;

  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: opener.id,
      allow: [
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    {
      id: interaction.guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
      ],
    },
  ];
  if (isSnowflake(cfg.staffRoleId)) {
    overwrites.push({
      id: cfg.staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const createOpts = {
    name: ticketName(num, type),
    type: ChannelType.GuildText,
    topic: buildTopic({ type, ownerId: opener.id, num }),
    permissionOverwrites: overwrites,
  };
  if (isSnowflake(cfg.categoryId)) createOpts.parent = cfg.categoryId;

  let channel;
  try {
    channel = await interaction.guild.channels.create(createOpts);
  } catch (err) {
    console.error('[Tickets] channel create failed:', err);
    await interaction.editReply({
      content: 'I could not create your ticket channel. The category may be full, or I may be missing **Manage Channels**. Please contact a staff member.',
    });
    return true;
  }

  const teamMention = isSnowflake(cfg.staffRoleId) ? `<@&${cfg.staffRoleId}>` : cfg.teamLabel;
  const botAvatar = interaction.client.user.displayAvatarURL({ size: 256 });

  const embed = new EmbedBuilder()
    .setColor(brandColor)
    .setAuthor({ name: `${COMMUNITY_NAME} • Support`, iconURL: botAvatar })
    .setTitle(`${cfg.emoji ?? '🎫'}  ${cfg.label}`)
    .setDescription(
      `${cfg.intro}\n\n` +
      '**While you wait:**\n' +
      '> • Share as much detail as you can up front.\n' +
      '> • Attach any screenshots, links or IDs that help.\n' +
      `> • A member of the **${cfg.teamLabel}** will be with you shortly.`,
    )
    .addFields(
      { name: '🎟️ Ticket', value: `\`${ticketName(num, type)}\``, inline: true },
      { name: '👤 Opened by', value: `<@${opener.id}>`, inline: true },
      { name: '🛡️ Assigned to', value: teamMention, inline: true },
      { name: '📅 Opened', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
    )
    .setThumbnail(botAvatar)
    .setFooter({ text: `${COMMUNITY_NAME} • Powered by Buildable Labs Studio`, iconURL: botAvatar })
    .setTimestamp();

  const ping = [`<@${opener.id}>`];
  if (isSnowflake(cfg.staffRoleId)) ping.push(`<@&${cfg.staffRoleId}>`);

  await channel.send({
    content: `${ping.join(' ')}`,
    embeds: [embed],
    components: [controlRow()],
  });
  await interaction.editReply({ content: `Your **${cfg.label}** ticket has been opened: ${channel}.` });
  console.log(`[Tickets] 🎫 ${opener.tag} opened ${ticketName(num, type)}`);
  return true;
}

// ── claim ─────────────────────────────────────────────────────────────────
async function claimTicket(interaction) {
  const { type } = parseTopic(interaction.channel.topic ?? '');
  const cfg = ticketTypes[type];
  if (!isStaffFor(interaction.member, cfg)) {
    await interaction.reply({ content: 'Only the ticket team can claim this ticket.', flags: MessageFlags.Ephemeral });
    return true;
  }

  const msg = interaction.message;
  const embed = EmbedBuilder.from(msg.embeds[0] ?? new EmbedBuilder())
    .addFields({ name: 'Claimed by', value: `<@${interaction.user.id}>`, inline: true });

  await interaction.update({ embeds: [embed], components: [controlRow(true)] });
  await interaction.followUp({ content: `Ticket claimed by <@${interaction.user.id}>.` });
  return true;
}

// ── close (confirm → execute) ───────────────────────────────────────────────
async function promptClose(interaction) {
  const { type, ownerId } = parseTopic(interaction.channel.topic ?? '');
  const cfg = ticketTypes[type];
  const allowed = interaction.user.id === ownerId || isStaffFor(interaction.member, cfg);
  if (!allowed) {
    await interaction.reply({ content: 'Only the ticket opener or the ticket team can close this ticket.', flags: MessageFlags.Ephemeral });
    return true;
  }

  const embed = new EmbedBuilder()
    .setColor(brandColor)
    .setDescription('Are you sure you want to **close** this ticket? A transcript will be saved.');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(CLOSE_CONFIRM_ID).setLabel('Confirm Close').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(CLOSE_CANCEL_ID).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
  );
  await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  return true;
}

async function closeTicket(interaction) {
  await interaction.update({ content: 'Closing ticket — saving transcript…', embeds: [], components: [] });
  await performClose(interaction.channel, interaction.guild, interaction.user);
  return true;
}

/**
 * Build the transcript, log it to the transcript channel, then delete the ticket
 * channel. Shared by the Close button and the `*close` text command.
 */
async function performClose(channel, guild, invokingUser) {
  const { type, ownerId, num } = parseTopic(channel.topic ?? '');
  const cfg = ticketTypes[type];

  const teamLabel = cfg?.teamLabel ?? 'Staff';
  const roleLabel = (author) =>
    author.id === ownerId ? 'Recipient' : author.bot ? 'Bot' : teamLabel;
  const identify = (m) => {
    const nick = m.member?.displayName ?? m.author.globalName ?? m.author.username;
    return `${nick} (${m.author.username}, ${m.author.id})`;
  };

  let transcript = '';
  let messageCount = 0;
  const participants = new Map();
  try {
    const fetched = await channel.messages.fetch({ limit: 100 });
    const ordered = [...fetched.values()].reverse();
    messageCount = ordered.length;
    transcript = ordered.map((m) => {
      if (!m.author.bot) participants.set(m.author.id, `${roleLabel(m.author)} — ${identify(m)}`);
      const when = new Date(m.createdTimestamp).toISOString();
      const parts = [];
      if (m.content) parts.push(m.content);
      for (const a of m.attachments.values()) parts.push(`[attachment] ${a.url}`);
      for (const e of m.embeds) if (e.title || e.description) parts.push(`[embed] ${e.title ?? ''} ${e.description ?? ''}`.trim());
      return `[${when}] ${identify(m)} [${roleLabel(m.author)}]: ${parts.join(' ') || '(no text)'}`;
    }).join('\n');
  } catch (err) {
    console.error('[Tickets] transcript build failed:', err);
    transcript = '(transcript could not be generated)';
  }

  const participantList = participants.size
    ? [...participants.values()].map((p) => `  • ${p}`).join('\n')
    : '  • (none)';
  const header =
    `${COMMUNITY_NAME} — Ticket Transcript\n` +
    `Channel: ${channel.name}\n` +
    `Type: ${cfg?.label ?? type}\n` +
    `Closed by: ${invokingUser.tag} (${invokingUser.id})\n` +
    `Closed at: ${new Date().toISOString()}\n` +
    `Messages: ${messageCount}\n\n` +
    `Participants:\n${participantList}\n` +
    `${'─'.repeat(50)}\n\n`;
  const file = new AttachmentBuilder(Buffer.from(header + transcript, 'utf8'), {
    name: `${channel.name}-transcript.txt`,
  });

  if (isSnowflake(transcriptChannelId)) {
    try {
      const logChannel = await guild.channels.fetch(transcriptChannelId);
      const summary = new EmbedBuilder()
        .setColor(brandColor)
        .setTitle(`Ticket Closed — ${cfg?.label ?? type}`)
        .addFields(
          { name: 'Ticket', value: channel.name, inline: true },
          { name: 'Opened by', value: ownerId ? `<@${ownerId}>` : 'unknown', inline: true },
          { name: 'Closed by', value: `<@${invokingUser.id}>`, inline: true },
          { name: 'Messages', value: String(messageCount), inline: true },
          { name: 'Closed', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
        .setFooter({ text: COMMUNITY_NAME });
      await logChannel.send({ embeds: [summary], files: [file] });
    } catch (err) {
      console.error('[Tickets] transcript post failed:', err);
    }
  }

  await channel.send({ content: 'This ticket is now closed. The channel will be deleted in 5 seconds.' }).catch(() => {});
  setTimeout(() => {
    channel.delete(`Ticket #${num} closed by ${invokingUser.tag}`).catch((err) =>
      console.error('[Tickets] channel delete failed:', err));
  }, 5000);
}

// ── hidden text commands (staff-only, prefix `*`) ───────────────────────────
const PREFIX = '*';

/**
 * Hidden `*` staff commands, usable only inside a ticket channel:
 *   *close                     — save the transcript & delete the ticket
 *   *rename <new name>         — rename the ticket channel
 *   *add <user id|@mention>    — give a member access to the ticket
 *   *remove <user id|@mention> — revoke a member's access
 *
 * Only staff for the ticket's type trigger these; anything else is ignored
 * silently so the commands stay invisible. Returns true if it handled a command.
 */
export async function handleTicketCommand(message) {
  if (message.author.bot || !message.guild) return false;
  if (!message.content.startsWith(PREFIX)) return false;
  if (!inTicketChannel(message.channel)) return false;

  const { type } = parseTopic(message.channel.topic ?? '');
  const cfg = ticketTypes[type];
  if (!isStaffFor(message.member, cfg)) return false; // hidden from non-staff

  const [raw, ...rest] = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = raw.toLowerCase();
  const arg = rest.join(' ').trim();
  const userId = arg.replace(/\D/g, ''); // strip <@…> mention chrome → digits

  switch (command) {
    case 'close': {
      await message.channel.send('Closing ticket — saving transcript…').catch(() => {});
      await performClose(message.channel, message.guild, message.author);
      return true;
    }
    case 'rename': {
      if (!arg) { await message.reply('Usage: `*rename <new name>`'); return true; }
      const clean = arg.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'ticket';
      try {
        await message.channel.setName(clean, `Renamed by ${message.author.tag}`);
        await message.reply(`Renamed this ticket to **${clean}**.`);
      } catch (err) {
        console.error('[Tickets] rename failed:', err);
        await message.reply('I could not rename this channel — I may be missing **Manage Channels**.');
      }
      return true;
    }
    case 'add': {
      if (!isSnowflake(userId)) { await message.reply('Usage: `*add <user id or @mention>`'); return true; }
      try {
        await message.channel.permissionOverwrites.edit(userId, {
          ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true,
        });
        await message.reply(`Added <@${userId}> to this ticket.`);
      } catch (err) {
        console.error('[Tickets] add failed:', err);
        await message.reply('I could not add that user — check the ID and that I have **Manage Roles/Channels**.');
      }
      return true;
    }
    case 'remove': {
      if (!isSnowflake(userId)) { await message.reply('Usage: `*remove <user id or @mention>`'); return true; }
      await message.channel.permissionOverwrites.delete(userId).catch(() => {});
      await message.reply(`Removed <@${userId}> from this ticket.`);
      return true;
    }
    default:
      return false; // unknown `*` word — leave it alone
  }
}
