import { EmbedBuilder, MessageFlags, ButtonInteraction } from 'discord.js';
import supabaseService from '../../services/supabase';
import { checkTeacherRole } from '../../utils/permissions';
import { replacePlaceholders } from '../../utils/formatting';
import { FIELDS, PLACEHOLDERS, ERRORS, DM } from '../../config/strings';
import { getLogger } from '../../utils/logger';
import consoleLogger from '../../utils/consoleLogger';

export default {
  customId: 'approve',
  async execute(interaction: ButtonInteraction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member as any)) {
        await interaction.reply({
          content: ERRORS.NO_PERMISSION,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.deferUpdate();

      // Get embed data
      const embed = interaction.message.embeds[0];
      const fields = embed.fields;

      // Extract user ID and amount from embed
      const userField = fields.find(f => f.name === FIELDS.USER);
      const amountField = fields.find(f => f.name === FIELDS.AMOUNT);
      const nivelField = fields.find(f => f.name === FIELDS.NIVEL);
      
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
      const reasonField = fields.find(f => f.name === FIELDS.REASON);
      const reason = reasonField?.value || PLACEHOLDERS.NOT_SPECIFIED;

      // Log transaction
      const logger = getLogger();
      await logger.logTransaction({
        type: 'REQUEST_APPROVED',
        userId: userId,
        amount: amount,
        reason: reason,
        performedBy: interaction.user.id
      });

      consoleLogger.transaction('SOLICITUD APROBADA', amount, userId);

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
        
        const dmMessage = replacePlaceholders(DM.COINS_RECEIVED, {
          amount: amount,
          reason: reason
        });
        await user.send(dmMessage);
      } catch (error) {
        consoleLogger.warn('DM', 'No se pudo enviar DM al usuario');
      }

      await interaction.followUp({
        content: '`✅` Solicitud aprobada',
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      consoleLogger.error('BOTÓN', 'Error en botón de aprobar', error as Error);
      await interaction.followUp({
        content: ERRORS.DATABASE_ERROR,
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
