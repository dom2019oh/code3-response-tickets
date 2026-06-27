import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildTicketPanel } from './panel.js';

// A channel is a ticket if our topic marker is present.
const isTicketChannel = (channel) => !!channel?.topic?.startsWith('ticket |');

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('ticketpanel')
      .setDescription('Post the ticket panel (dropdown) in this channel.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await interaction.channel.send(buildTicketPanel(interaction.client));
      await interaction.reply({ content: 'Ticket panel posted.', flags: MessageFlags.Ephemeral });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('add')
      .setDescription('Add a member to this ticket.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addUserOption((o) => o.setName('user').setDescription('Member to add').setRequired(true)),
    async execute(interaction) {
      if (!isTicketChannel(interaction.channel)) {
        return interaction.reply({ content: 'This command can only be used inside a ticket channel.', flags: MessageFlags.Ephemeral });
      }
      const user = interaction.options.getUser('user');
      await interaction.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true,
      });
      await interaction.reply({ content: `Added ${user} to this ticket.` });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Remove a member from this ticket.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addUserOption((o) => o.setName('user').setDescription('Member to remove').setRequired(true)),
    async execute(interaction) {
      if (!isTicketChannel(interaction.channel)) {
        return interaction.reply({ content: 'This command can only be used inside a ticket channel.', flags: MessageFlags.Ephemeral });
      }
      const user = interaction.options.getUser('user');
      await interaction.channel.permissionOverwrites.delete(user.id).catch(() => {});
      await interaction.reply({ content: `Removed ${user} from this ticket.` });
    },
  },
];
