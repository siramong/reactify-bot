const { Events } = require('discord.js');
const { initLogger } = require('../utils/logger');
const log = require('../utils/consoleLogger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    // Initialize logger
    initLogger(client);
    
    // Display system info
    log.systemInfo({
      'Bot': client.user.tag,
      'ID': client.user.id,
      'Servidores': client.guilds.cache.size,
      'Usuarios': client.users.cache.size,
      'Node.js': process.version,
      'Discord.js': require('discord.js').version
    });
    
    log.success('SISTEMA', 'Logger de transacciones inicializado');
    log.success('BOT', '¡Bot completamente operativo y listo para usar!');
    
    // Set bot status
    client.user.setActivity('¡Usa /coins get!', { type: 'WATCHING' });
  },
};
