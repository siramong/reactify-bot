const { Client, GatewayIntentBits, Collection } = require('discord.js');
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

// Login to Discord
log.startup('Conectando con Discord...');
client.login(config.DISCORD_TOKEN);
