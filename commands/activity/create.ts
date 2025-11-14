import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChatInputCommandInteraction } from 'discord.js';
import { checkTeacherRole } from '../../utils/permissions';
import * as pendingAttachments from '../../utils/pendingAttachments';
import { MODALS, ERRORS } from '../../config/strings';

export default {
  data: new SlashCommandBuilder()
    .setName('activity')
    .setDescription('Comandos de actividades (solo docentes)')
    .addAttachmentOption(option =>
      option
        .setName('attachment')
        .setDescription('Adjunto de referencia (archivo) - Opcional')
        .setRequired(false)
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member as any)) {
        await interaction.reply({
          content: ERRORS.NO_PERMISSION,
          flags: 64 // Ephemeral
        });
        return;
      }

      // If the user provided an attachment option with the command, store it
      // so the modal submit handler can access it later.
      const attachmentOption = interaction.options.get('attachment');
      if (attachmentOption && attachmentOption.attachment) {
        pendingAttachments.set(interaction.user.id, attachmentOption.attachment as any);
      }

      // Show modal to create activity
      const modal = new ModalBuilder()
        .setCustomId('activitycreate')
        .setTitle(MODALS.ACTIVITY_TITLE);

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

      const rewardInput = new TextInputBuilder()
        .setCustomId('reward')
        .setLabel('Recompensa en monedas - Opcional')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(5);

      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
      const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(docsInput);
      const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(rewardInput);

      modal.addComponents(row1, row2, row3, row4);

      await interaction.showModal(modal);
    } catch (error) {
      console.error('Error in activity create command:', error);
      await interaction.reply({
        content: ERRORS.DATABASE_ERROR,
        flags: 64 // Ephemeral
      });
    }
  },
};
