import { SlashCommandSubcommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';
import { checkTeacherRole } from '../../utils/permissions';
import { BUTTONS, MODALS, ERRORS } from '../../config/strings';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('reset')
    .setDescription('Resetear monedas (solo docentes)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Usuario específico (opcional)')
        .setRequired(false)),
  
  async execute(interaction: CommandInteraction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member as any)) {
        await interaction.reply({
          content: ERRORS.NO_PERMISSION,
          flags: 64 // Ephemeral
        });
        return;
      }

      const targetUser = interaction.options.getUser('user');

      // If specific user
      if (targetUser) {
        const confirmButton = new ButtonBuilder()
          .setCustomId(`confirmreset_user_${targetUser.id}`)
          .setLabel(BUTTONS.CONFIRM)
          .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
          .setCustomId(`confirmreset_cancel`)
          .setLabel(BUTTONS.CANCEL)
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

        await interaction.reply({
          content: `⚠️ ¿Estás seguro de que quieres resetear las monedas de ${targetUser.username} a 0?`,
          components: [row],
          flags: 64 // Ephemeral
        });
      } else {
        // Full reset - show modal
        const modal = new ModalBuilder()
          .setCustomId(`resetconfirm_all`)
          .setTitle(MODALS.RESET_CONFIRM_TITLE);

        const confirmInput = new TextInputBuilder()
          .setCustomId('confirmation')
          .setLabel('Escribe "CONFIRMAR RESET" para continuar')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(confirmInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }
    } catch (error) {
      console.error('Error in coins reset command:', error);
      await interaction.reply({
        content: ERRORS.DATABASE_ERROR,
        flags: 64 // Ephemeral
      });
    }
  },
};
