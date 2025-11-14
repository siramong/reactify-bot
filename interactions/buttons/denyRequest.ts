import { EmbedBuilder, MessageFlags, ButtonInteraction } from 'discord.js';
import { checkTeacherRole } from '../../utils/permissions';
import { FIELDS, ERRORS } from '../../config/strings';
import { getLogger } from '../../utils/logger';
import consoleLogger from '../../utils/consoleLogger';

export default {
  customId: 'deny',
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
      
      const userMention = userField?.value || '';
      const userId = userMention.match(/<@(\d+)>/)?.[1];
      const amount = parseInt(amountField?.value || '0');

      if (!userId) {
        await interaction.followUp({
          content: '`❌` Error al procesar la solicitud.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Log transaction
      const logger = getLogger();
      await logger.logTransaction({
        type: 'REQUEST_DENIED',
        userId: userId,
        amount: amount,
        performedBy: interaction.user.id
      });

      consoleLogger.info('SOLICITUD', `Rechazada: ${amount} monedas - Usuario: ${userId}`);

      // Update embed to show denied
      const updatedEmbed = EmbedBuilder.from(embed)
        .setColor(0xe74c3c) // Red
        .setFooter({ text: `Rechazado por ${interaction.user.username}` });

      await interaction.message.edit({
        embeds: [updatedEmbed],
        components: [] // Remove buttons
      });

      // Try to DM the user
      try {
        const user = await interaction.client.users.fetch(userId);
        await user.send(`\`❌\` Tu solicitud de ${amount} monedas ha sido rechazada.`);
      } catch (error) {
        consoleLogger.warn('DM', 'No se pudo enviar DM al usuario');
      }

      await interaction.followUp({
        content: '`✅` Solicitud rechazada',
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      consoleLogger.error('BOTÓN', 'Error en botón de rechazar', error as Error);
      await interaction.followUp({
        content: ERRORS.DATABASE_ERROR,
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
