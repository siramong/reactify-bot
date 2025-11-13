const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { checkTeacherRole } = require('../../utils/permissions');
const strings = require('../../config/strings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity')
    .setDescription('Comandos de actividades (solo docentes)'),
  
  async execute(interaction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member)) {
        await interaction.reply({
          content: strings.ERRORS.NO_PERMISSION,
          ephemeral: true
        });
        return;
      }

      // Show modal to create activity
      const modal = new ModalBuilder()
        .setCustomId('activitycreate')
        .setTitle(strings.MODALS.ACTIVITY_TITLE);

      const titleInput = new TextInputBuilder()
        .setCustomId('title')
        .setLabel('Título')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Descripción')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      const docsInput = new TextInputBuilder()
        .setCustomId('documentation')
        .setLabel('Documentación (URLs separadas por comas)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500);

      const deadlineInput = new TextInputBuilder()
        .setCustomId('deadline')
        .setLabel('Fecha límite (AAAA-MM-DD) - Opcional')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(10);

      const rewardInput = new TextInputBuilder()
        .setCustomId('reward')
        .setLabel('Recompensa en monedas - Opcional')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(5);

      const row1 = new ActionRowBuilder().addComponents(titleInput);
      const row2 = new ActionRowBuilder().addComponents(descriptionInput);
      const row3 = new ActionRowBuilder().addComponents(docsInput);
      const row4 = new ActionRowBuilder().addComponents(deadlineInput);
      const row5 = new ActionRowBuilder().addComponents(rewardInput);

      modal.addComponents(row1, row2, row3, row4, row5);

      await interaction.showModal(modal);
    } catch (error) {
      console.error('Error in activity create command:', error);
      await interaction.reply({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
