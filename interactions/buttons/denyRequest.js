const { EmbedBuilder, MessageFlags } = require('discord.js');
const { checkTeacherRole } = require('../../utils/permissions');
const strings = require('../../config/strings');
const { getLogger } = require('../../utils/logger');
const log = require('../../utils/consoleLogger');

module.exports = {
  customId: 'deny',
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

      log.info('SOLICITUD', `Rechazada: ${amount} monedas - Usuario: ${userId}`);

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
        log.warn('DM', 'No se pudo enviar DM al usuario');
      }

      await interaction.followUp({
        content: '`✅` Solicitud rechazada',
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      log.error('BOTÓN', 'Error en botón de rechazar', error);
      await interaction.followUp({
        content: strings.ERRORS.DATABASE_ERROR,
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
