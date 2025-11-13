const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

/**
 * Dedicated logging module for transaction logging to teacher channel
 */
class Logger {
  constructor(client) {
    this.client = client;
    this.teacherChannelId = config.TEACHER_CHANNEL_ID;
  }

  /**
   * Get the teacher channel
   */
  async getTeacherChannel() {
    if (!this.teacherChannelId) {
      console.error('TEACHER_CHANNEL_ID not configured');
      return null;
    }
    
    try {
      return await this.client.channels.fetch(this.teacherChannelId);
    } catch (error) {
      console.error('Error fetching teacher channel:', error);
      return null;
    }
  }

  /**
   * Log a transaction to the teacher channel
   * @param {Object} data - Transaction data
   * @param {string} data.type - Type of transaction (COINS_ADDED, COINS_REMOVED, etc.)
   * @param {string} data.userId - User ID involved
   * @param {string} data.username - Username
   * @param {number} data.amount - Amount of coins
   * @param {string} data.reason - Reason for transaction
   * @param {string} data.performedBy - User who performed the action
   * @param {string} data.nivel - User's nivel (level)
   */
  async logTransaction(data) {
    const channel = await this.getTeacherChannel();
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: `ID: ${data.userId}` });

      switch (data.type) {
        case 'COINS_ADDED':
          embed
            .setTitle('`💰` Monedas Añadidas')
            .setColor(0x2ecc71) // Green
            .addFields(
              { name: 'Usuario', value: `<@${data.userId}>`, inline: true },
              { name: 'Cantidad', value: `**+${data.amount}** monedas`, inline: true },
              { name: 'Nivel', value: data.nivel || '*No configurado*', inline: true },
              { name: 'Razón', value: data.reason || 'No especificada', inline: false },
              { name: 'Realizado por', value: `<@${data.performedBy}>`, inline: false }
            );
          break;

        case 'COINS_REMOVED':
          embed
            .setTitle('`⚠️` Monedas Removidas')
            .setColor(0xe74c3c) // Red
            .addFields(
              { name: 'Usuario', value: `<@${data.userId}>`, inline: true },
              { name: 'Cantidad', value: `**-${data.amount}** monedas`, inline: true },
              { name: 'Nivel', value: data.nivel || '*No configurado*', inline: true },
              { name: 'Razón', value: data.reason || 'No especificada', inline: false },
              { name: 'Realizado por', value: `<@${data.performedBy}>`, inline: false }
            );
          break;

        case 'COINS_RESET':
          embed
            .setTitle('`🔄` Monedas Reseteadas')
            .setColor(0xf39c12) // Orange
            .addFields(
              { name: 'Usuario', value: data.userId === 'ALL' ? '**Todos los usuarios**' : `<@${data.userId}>`, inline: true },
              { name: 'Realizado por', value: `<@${data.performedBy}>`, inline: true }
            );
          break;

        case 'AUCTION_CREATED':
          embed
            .setTitle('`🔨` Subasta Creada')
            .setColor(0x9b59b6) // Purple
            .addFields(
              { name: 'Artículo', value: data.itemName, inline: true },
              { name: 'Puja inicial', value: `${data.startingBid} monedas`, inline: true },
              { name: 'Nivel', value: data.nivel, inline: true },
              { name: 'Duración', value: `${data.duration} minutos`, inline: true },
              { name: 'Creado por', value: `<@${data.performedBy}>`, inline: true }
            );
          break;

        case 'AUCTION_ENDED':
          embed
            .setTitle('`🎉` Subasta Finalizada')
            .setColor(0x3498db) // Blue
            .addFields(
              { name: 'Artículo', value: data.itemName, inline: true },
              { name: 'Ganador', value: data.winnerId ? `<@${data.winnerId}>` : 'Sin postores', inline: true },
              { name: 'Precio final', value: `${data.finalPrice} monedas`, inline: true }
            );
          break;

        case 'ACTIVITY_CREATED':
          embed
            .setTitle('`📚` Actividad Creada')
            .setColor(0x1abc9c) // Turquoise
            .addFields(
              { name: 'Título', value: data.title, inline: false },
              { name: 'Nivel', value: data.nivel, inline: true },
              { name: 'Recompensa', value: data.reward > 0 ? `${data.reward} monedas` : 'Sin recompensa', inline: true },
              { name: 'Creado por', value: `<@${data.performedBy}>`, inline: true }
            );
          break;

        case 'REQUEST_APPROVED':
          embed
            .setTitle('`✅` Solicitud Aprobada')
            .setColor(0x2ecc71) // Green
            .addFields(
              { name: 'Solicitante', value: `<@${data.userId}>`, inline: true },
              { name: 'Cantidad', value: `**+${data.amount}** monedas`, inline: true },
              { name: 'Aprobado por', value: `<@${data.performedBy}>`, inline: true },
              { name: 'Razón', value: data.reason, inline: false }
            );
          break;

        case 'REQUEST_DENIED':
          embed
            .setTitle('`❌` Solicitud Rechazada')
            .setColor(0x95a5a6) // Gray
            .addFields(
              { name: 'Solicitante', value: `<@${data.userId}>`, inline: true },
              { name: 'Cantidad solicitada', value: `${data.amount} monedas`, inline: true },
              { name: 'Rechazado por', value: `<@${data.performedBy}>`, inline: true }
            );
          break;

        default:
          console.warn('Unknown transaction type:', data.type);
          return;
      }

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }

  /**
   * Log a general message to the teacher channel
   * @param {string} message - Message to log
   */
  async logMessage(message) {
    const channel = await this.getTeacherChannel();
    if (!channel) return;

    try {
      await channel.send(message);
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }
}

// Singleton instance
let loggerInstance = null;

/**
 * Initialize the logger with the Discord client
 * @param {Client} client - Discord client
 */
function initLogger(client) {
  loggerInstance = new Logger(client);
  return loggerInstance;
}

/**
 * Get the logger instance
 * @returns {Logger}
 */
function getLogger() {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call initLogger first.');
  }
  return loggerInstance;
}

module.exports = { initLogger, getLogger };
