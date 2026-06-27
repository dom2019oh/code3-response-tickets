import { GatewayIntentBits, ActivityType, Events } from 'discord.js';
import { createBot } from './bot.js';
import { commands } from './commands.js';
import { handleTicket, handleTicketCommand } from './tickets.js';
import { COMMUNITY_NAME } from './config.js';

const client = createBot({
  name: `${COMMUNITY_NAME} Tickets`,
  token: process.env.DISCORD_TOKEN,
  // GuildMessages + MessageContent power the hidden `*` staff commands
  // (*close / *rename / *add / *remove). MessageContent is PRIVILEGED — it must
  // be enabled in the Developer Portal or the bot will fail to log in.
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  presence: { status: 'online', activities: [{ name: 'support tickets', type: ActivityType.Listening }] },
  commands,
  onInteraction: (interaction) => handleTicket(interaction),
});

// Hidden `*` staff commands inside ticket channels.
client.on(Events.MessageCreate, (message) => {
  handleTicketCommand(message).catch((err) =>
    console.error('[Tickets] text command error:', err));
});
