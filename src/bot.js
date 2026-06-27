import 'dotenv/config'; // load .env locally; on Railway the vars are injected
import { Client, Events, ActivityType, REST, Routes, MessageFlags } from 'discord.js';

/**
 * Spin up a Discord bot, log it in, and put it Online. Returns the client so the
 * caller can attach extra handlers (e.g. the hidden `*` text commands).
 *
 * Slash commands are registered to GUILD_ID when set (instant), otherwise
 * globally (can take up to an hour to appear — fine for production).
 *
 * @param {object}   opts
 * @param {string}   opts.name            Display name used in logs
 * @param {string}   opts.token           Bot token (from env)
 * @param {number[]} opts.intents         Gateway intents
 * @param {object}   [opts.presence]      Optional custom presence
 * @param {Array<{data:object, execute:Function}>} [opts.commands]
 * @param {Function} [opts.onInteraction] Handler for non-command interactions
 */
export function createBot({ name, token, intents, presence, commands = [], onInteraction }) {
  if (!token) {
    console.error(`[${name}] ❌ Missing bot token — set DISCORD_TOKEN, then restart.`);
    process.exit(1);
  }

  const client = new Client({
    intents,
    presence: presence ?? {
      status: 'online',
      activities: [{ name: 'support tickets', type: ActivityType.Listening }],
    },
  });

  client.commands = new Map(commands.map((c) => [c.data.name, c]));

  client.once(Events.ClientReady, async (c) => {
    console.log(`[${name}] ✅ Online as ${c.user.tag} — serving ${c.guilds.cache.size} guild(s).`);
    if (!commands.length) return;
    try {
      const rest = new REST().setToken(token);
      const body = commands.map((cmd) => cmd.data.toJSON());
      const guildId = process.env.GUILD_ID;
      if (guildId) {
        await rest.put(Routes.applicationGuildCommands(c.user.id, guildId), { body });
        console.log(`[${name}] ⚙️  Registered ${commands.length} command(s) to guild ${guildId}.`);
      } else {
        await rest.put(Routes.applicationCommands(c.user.id), { body });
        console.log(`[${name}] ⚙️  Registered ${commands.length} global command(s) (may take up to 1h).`);
      }
    } catch (err) {
      console.error(`[${name}] command registration failed:`, err);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (cmd) {
          await cmd.execute(interaction, client);
          return;
        }
      }
      if (onInteraction) await onInteraction(interaction, client);
    } catch (err) {
      console.error(`[${name}] interaction error:`, err);
      const payload = { content: 'Something went wrong handling that.', flags: MessageFlags.Ephemeral };
      if (interaction.isRepliable()) {
        (interaction.deferred || interaction.replied
          ? interaction.followUp(payload)
          : interaction.reply(payload)
        ).catch(() => {});
      }
    }
  });

  client.on(Events.Error, (err) => console.error(`[${name}] ⚠️  client error:`, err));
  process.on('unhandledRejection', (err) => console.error(`[${name}] ⚠️  unhandled rejection:`, err));

  client.login(token);
  return client;
}
