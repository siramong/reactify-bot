const { EmbedBuilder, MessageFlags } = require('discord.js');
const supabaseService = require('../../services/supabase');
const { checkTeacherRole } = require('../../utils/permissions');
const { replacePlaceholders } = require('../../utils/formatting');
const strings = require('../../config/strings');
const { getLogger } = require('../../utils/logger');
const log = require('../../utils/consoleLogger');

module.exports = {
  customId: 'approve',
  async execute(interaction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member)) {
        await interaction.reply({
          content: strings.ERRORS.NO_PERMISSION,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.deferUpdate();

      // Get embed data
      const embed = interaction.message.embeds[0];
      const fields = embed.fields;

      // Extract user ID and amount from embed
      const userField = fields.find(f => f.name === strings.FIELDS.USER);
      const amountField = fields.find(f => f.name === strings.FIELDS.AMOUNT);
      const nivelField = fields.find(f => f.name === strings.FIELDS.NIVEL);
      
      const userMention = userField?.value || '';
      const userId = userMention.match(/<@(\d+)>/)?.[1];
      const amount = parseInt(amountField?.value || '0');
      const nivel = nivelField?.value || 'No configurado';

      if (!userId || !amount) {
        await interaction.followUp({
          content: '`❌` Error al procesar la solicitud.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Add coins to user
      await supabaseService.addCoins(userId, amount);

      // Get reason for logging
      const reasonField = fields.find(f => f.name === strings.FIELDS.REASON);
      const reason = reasonField?.value || strings.PLACEHOLDERS.NOT_SPECIFIED;

      // Log transaction
      const logger = getLogger();
      await logger.logTransaction({
        type: 'REQUEST_APPROVED',
        userId: userId,
        amount: amount,
        reason: reason,
        performedBy: interaction.user.id
      });

      log.transaction('SOLICITUD APROBADA', amount, userId);

      // Update embed to show approved
      const updatedEmbed = EmbedBuilder.from(embed)
        .setColor(0x2ecc71) // Green
        .setFooter({ text: `Aprobado por ${interaction.user.username}` });

      await interaction.message.edit({
        embeds: [updatedEmbed],
        components: [] // Remove buttons
      });

      // Try to DM the user
      try {
        const user = await interaction.client.users.fetch(userId);
        
        const dmMessage = replacePlaceholders(strings.DM.COINS_RECEIVED, {
          amount: amount,
          reason: reason
        });
        await user.send(dmMessage);
      } catch (error) {
        log.warn('DM', 'No se pudo enviar DM al usuario');
      }

      await interaction.followUp({
        content: '`✅` Solicitud aprobada',
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      log.error('BOTÓN', 'Error en botón de aprobar', error);
      await interaction.followUp({
        content: strings.ERRORS.DATABASE_ERROR,
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
