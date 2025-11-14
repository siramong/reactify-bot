const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const { initLogger } = require('./utils/logger');
const log = require('./utils/consoleLogger');

// Print startup banner
log.banner('REACTIFY BOT');

// Create Discord client
log.startup('Inicializando cliente de Discord...');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ]
});

// Initialize command collections
client.commands = new Collection();

// Load command files
function loadCommands(dir, commandPath = []) {
  const fullPath = path.join(__dirname, 'commands', ...dir);
  
  if (!fs.existsSync(fullPath)) {
    return;
  }
  
  const files = fs.readdirSync(fullPath);
  
  for (const file of files) {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      loadCommands([...dir, file], [...commandPath, file]);
    } else if (file.endsWith('.js')) {
      const command = require(filePath);
      if (command.data && command.execute) {
        const commandName = [...commandPath, path.parse(file).name].join('_');
        client.commands.set(commandName, command);
        log.success('COMANDO', `Cargado: /${commandName.replace('_', ' ')}`);
      }
    }
  }
}

// Load all commands recursively from the `commands` folder
log.info('SISTEMA', 'Cargando comandos...');
loadCommands([]);

// Build commands payload for registration (mirrors register-commands.js)
function buildCommandsPayload() {
  const commands = [];
  const commandsDir = path.join(__dirname, 'commands');

  if (!fs.existsSync(commandsDir)) return commands;

  const entries = fs.readdirSync(commandsDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(commandsDir, entry.name);

    if (entry.isDirectory()) {
      const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.js'));
      const subcommandOptions = [];
      let pushedTopLevel = false;

      for (const file of files) {
        const mod = require(path.join(entryPath, file));
        if (!mod || !mod.data) continue;

        const ctor = mod.data.constructor && mod.data.constructor.name;

        if (ctor === 'SlashCommandBuilder') {
          commands.push(mod.data.toJSON());
          pushedTopLevel = true;
        } else if (ctor === 'SlashCommandSubcommandBuilder') {
          subcommandOptions.push(mod.data.toJSON());
        } else {
          try {
            const json = mod.data.toJSON();
            if (json.type === 1) subcommandOptions.push(json);
            else commands.push(json);
          } catch (err) {
            // ignore unknown exports
          }
        }
      }

      if (subcommandOptions.length > 0 && !pushedTopLevel) {
        const parent = new SlashCommandBuilder()
          .setName(entry.name)
          .setDescription(`Comandos de ${entry.name}`);

        const parentJson = parent.toJSON();
        parentJson.options = subcommandOptions;
        commands.push(parentJson);
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const mod = require(entryPath);
      if (mod && mod.data) {
        try {
          commands.push(mod.data.toJSON());
        } catch (err) {
          // ignore
        }
      }
    }
  }

  return commands;
}

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

log.info('SISTEMA', 'Cargando manejadores de eventos...');
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  log.success('EVENTO', `Registrado: ${event.name}`);
}

// Login to Discord (and register commands automatically)
log.startup('Conectando con Discord...');

// Register application commands automatically unless SKIP_REGISTRATION=1
(async () => {
  try {
    const skip = process.env.SKIP_REGISTRATION === '1';
    const applicationId = process.env.APPLICATION_ID;

    if (skip) {
      log.info('SISTEMA', 'SKIP_REGISTRATION=1 -> construcción de comandos (no registro)');
      const built = buildCommandsPayload();
      log.info('SISTEMA', JSON.stringify(built, null, 2));
    } else {
      if (!applicationId) {
        log.error('SISTEMA', '❌ APPLICATION_ID no está configurado en .env; omitiendo registro de comandos');
      } else {
        log.startup('SISTEMA', 'Registrando comandos slash...');
        const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN || process.env.DISCORD_TOKEN);
        const commandsPayload = buildCommandsPayload();
        await rest.put(
          Routes.applicationCommands(applicationId),
          { body: commandsPayload }
        );
        log.success('SISTEMA', '✅ Comandos registrados exitosamente');
      }
    }
  } catch (error) {
    log.error('SISTEMA', `❌ Error al registrar comandos: ${error.message || error}`);
  } finally {
    // Start the client regardless of registration outcome
    client.login(config.DISCORD_TOKEN);
  }
})();
