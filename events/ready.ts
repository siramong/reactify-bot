import { Events, Client } from 'discord.js';
import { initLogger } from '../utils/logger';
import consoleLogger from '../utils/consoleLogger';
import { version as discordVersion } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    // Initialize logger
    initLogger(client);
    
    // Display system info
    consoleLogger.systemInfo({
      'Bot': client.user!.tag,
      'ID': client.user!.id,
      'Servidores': client.guilds.cache.size,
      'Usuarios': client.users.cache.size,
      'Node.js': process.version,
      'Discord.js': discordVersion
    });
    
    consoleLogger.success('SISTEMA', 'Logger de transacciones inicializado');
    consoleLogger.success('BOT', '¡Bot completamente operativo y listo para usar!');
    
    // Set bot status
    client.user!.setActivity('¡Usa /coins get!', { type: 3 }); // 3 = WATCHING
  },
};
