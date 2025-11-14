import { SlashCommandSubcommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ensureUserExists } from '../../utils/userManager';
import * as pendingAttachments from '../../utils/pendingAttachments';
import { MODALS, ERRORS } from '../../config/strings';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('request')
    .setDescription('Solicitar monedas a los docentes')
    .addAttachmentOption(option =>
      option
        .setName('attachment')
        .setDescription('Adjunto de referencia (archivo) - Opcional')
        .setRequired(false)
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Ensure user exists
      await ensureUserExists(interaction.user.id, interaction.user.username);

      // If the user provided an attachment option with the command, store it
      // so the modal submit handler can access it.
      const attachmentOption = interaction.options.get('attachment');
      if (attachmentOption && attachmentOption.attachment) {
        pendingAttachments.set(interaction.user.id, attachmentOption.attachment as any);
      }

      // Create modal
      const modal = new ModalBuilder()
        .setCustomId(`coinrequest_${interaction.user.id}`)
        .setTitle(MODALS.REQUEST_TITLE);

      // Reason field
      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Razón')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

      // Amount field
      const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Cantidad')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Ejemplo: 100')
        .setMinLength(1)
        .setMaxLength(4);

      // Description field
      const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Descripción adicional')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500);

      const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
      const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
      const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

      modal.addComponents(firstRow, secondRow, thirdRow);

      await interaction.showModal(modal);
    } catch (error) {
      console.error('Error in coins request command:', error);
      await interaction.reply({
        content: ERRORS.DATABASE_ERROR,
        flags: 64 // Ephemeral
      });
    }
  },
};
