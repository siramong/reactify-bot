import { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './config/config';
import { initLogger } from './utils/logger';
import consoleLogger from './utils/consoleLogger';

// Extend Client type to include commands
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
}

// Print startup banner
consoleLogger.banner('REACTIFY BOT');

// Create Discord client
consoleLogger.startup('Inicializando cliente de Discord...');
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
function loadCommands(dir: string[], commandPath: string[] = []): void {
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
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      const command = require(filePath);
      const commandData = command.default || command;
      if (commandData.data && commandData.execute) {
        const commandName = [...commandPath, path.parse(file).name].join('_');
        client.commands.set(commandName, commandData);
        consoleLogger.success('COMANDO', `Cargado: /${commandName.replace('_', ' ')}`);
      }
    }
  }
}

// Load all commands recursively from the `commands` folder
consoleLogger.info('SISTEMA', 'Cargando comandos...');
loadCommands([]);

// Build commands payload for registration (mirrors register-commands.js)
function buildCommandsPayload(): any[] {
  const commands: any[] = [];
  const commandsDir = path.join(__dirname, 'commands');

  if (!fs.existsSync(commandsDir)) return commands;

  const entries = fs.readdirSync(commandsDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(commandsDir, entry.name);

    if (entry.isDirectory()) {
      const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
      const subcommandOptions: any[] = [];
      let pushedTopLevel = false;

      for (const file of files) {
        const mod = require(path.join(entryPath, file));
        const modData = mod.default || mod;
        if (!modData || !modData.data) continue;

        const ctor = modData.data.constructor && modData.data.constructor.name;

        if (ctor === 'SlashCommandBuilder') {
          commands.push(modData.data.toJSON());
          pushedTopLevel = true;
        } else if (ctor === 'SlashCommandSubcommandBuilder') {
          subcommandOptions.push(modData.data.toJSON());
        } else {
          try {
            const json = modData.data.toJSON();
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

        const parentJson: any = parent.toJSON();
        parentJson.options = subcommandOptions;
        commands.push(parentJson);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
      const mod = require(entryPath);
      const modData = mod.default || mod;
      if (modData && modData.data) {
        try {
          commands.push(modData.data.toJSON());
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
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

consoleLogger.info('SISTEMA', 'Cargando manejadores de eventos...');
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  const eventData = event.default || event;
  
  if (eventData.once) {
    client.once(eventData.name, (...args: any[]) => eventData.execute(...args));
  } else {
    client.on(eventData.name, (...args: any[]) => eventData.execute(...args));
  }
  consoleLogger.success('EVENTO', `Registrado: ${eventData.name}`);
}

// Login to Discord (and register commands automatically)
consoleLogger.startup('Conectando con Discord...');

// Register application commands automatically unless SKIP_REGISTRATION=1
(async () => {
  try {
    const skip = process.env.SKIP_REGISTRATION === '1';
    const applicationId = process.env.APPLICATION_ID;

    if (skip) {
      consoleLogger.info('SISTEMA', 'SKIP_REGISTRATION=1 -> construcción de comandos (no registro)');
      const built = buildCommandsPayload();
      consoleLogger.info('SISTEMA', JSON.stringify(built, null, 2));
    } else {
      if (!applicationId) {
        consoleLogger.error('SISTEMA', '❌ APPLICATION_ID no está configurado en .env; omitiendo registro de comandos');
      } else {
        consoleLogger.startup('SISTEMA', 'Registrando comandos slash...');
        const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN || process.env.DISCORD_TOKEN!);
        const commandsPayload = buildCommandsPayload();
        await rest.put(
          Routes.applicationCommands(applicationId),
          { body: commandsPayload }
        );
        consoleLogger.success('SISTEMA', '✅ Comandos registrados exitosamente');
      }
    }
  } catch (error) {
    consoleLogger.error('SISTEMA', `❌ Error al registrar comandos: ${(error as Error).message || error}`);
  } finally {
    // Start the client regardless of registration outcome
    client.login(config.DISCORD_TOKEN);
  }
})();
