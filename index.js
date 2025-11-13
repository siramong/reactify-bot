const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');

// Create Discord client
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
        console.log(`Loaded command: ${commandName}`);
      }
    }
  }
}

// Load all commands recursively from the `commands` folder
// This ensures command keys include their parent folder as a prefix
// (e.g. `coins_get`) to match the lookup in `interactionCreate.js`.
loadCommands([]);

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`Loaded event: ${event.name}`);
}

// Login to Discord
client.login(config.DISCORD_TOKEN);
