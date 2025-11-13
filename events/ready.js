const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`📊 Conectado a ${client.guilds.cache.size} servidores`);
    
    // Set bot status
    client.user.setActivity('¡Usa /coins get!', { type: 'WATCHING' });
  },
};
