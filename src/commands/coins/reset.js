const { SlashCommandSubcommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkTeacherRole } = require('../../utils/permissions');
const strings = require('../../config/strings');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('reset')
    .setDescription('Resetear monedas (solo docentes)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Usuario específico (opcional)')
        .setRequired(false)),
  
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

      const targetUser = interaction.options.getUser('user');

      // If specific user
      if (targetUser) {
        const confirmButton = new ButtonBuilder()
          .setCustomId(`confirmreset_user_${targetUser.id}`)
          .setLabel(strings.BUTTONS.CONFIRM)
          .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
          .setCustomId(`confirmreset_cancel`)
          .setLabel(strings.BUTTONS.CANCEL)
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        await interaction.reply({
          content: `⚠️ ¿Estás seguro de que quieres resetear las monedas de ${targetUser.username} a 0?`,
          components: [row],
          ephemeral: true
        });
      } else {
        // Full reset - show modal
        const modal = new ModalBuilder()
          .setCustomId(`resetconfirm_all`)
          .setTitle(strings.MODALS.RESET_CONFIRM_TITLE);

        const confirmInput = new TextInputBuilder()
          .setCustomId('confirmation')
          .setLabel('Escribe "CONFIRMAR RESET" para continuar')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20);

        const row = new ActionRowBuilder().addComponents(confirmInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }
    } catch (error) {
      console.error('Error in coins reset command:', error);
      await interaction.reply({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
