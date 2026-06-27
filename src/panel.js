import {
  EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} from 'discord.js';
import { ticketTypes, panel, brandColor, COMMUNITY_NAME } from './config.js';
import { TICKET_SELECT_ID } from './tickets.js';

export { TICKET_SELECT_ID };

/**
 * The ticket panel message — a polished header embed plus the ticket-type
 * dropdown. Pass the client so the bot's avatar can be used as the thumbnail.
 */
export function buildTicketPanel(client) {
  const avatar = client?.user?.displayAvatarURL?.({ size: 256 }) ?? null;

  // One block per type: emoji + bold label, with the blurb as a quoted subline.
  const list = Object.values(ticketTypes)
    .map((t) => `${t.emoji ?? ''} **${t.label}**\n> ${t.blurb ?? t.description}`)
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(brandColor)
    .setAuthor(avatar ? { name: `${COMMUNITY_NAME} • Support`, iconURL: avatar } : { name: `${COMMUNITY_NAME} • Support` })
    .setTitle('🎫 Open a Support Ticket')
    .setDescription(`${panel.intro}\n\n${list}`)
    .setFooter({ text: `${COMMUNITY_NAME} • Powered by Buildable Labs Studio` });
  if (avatar) embed.setThumbnail(avatar);

  const menu = new StringSelectMenuBuilder()
    .setCustomId(TICKET_SELECT_ID)
    .setPlaceholder('Select a ticket type…')
    .addOptions(
      Object.values(ticketTypes).map((t) => {
        const opt = new StringSelectMenuOptionBuilder()
          .setLabel(t.label)
          .setValue(t.key)
          .setDescription(t.description.slice(0, 100));
        if (t.emoji) opt.setEmoji(t.emoji);
        return opt;
      }),
    );

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}
