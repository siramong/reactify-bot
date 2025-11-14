const { SlashCommandSubcommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ensureUserExists } = require('../../utils/userManager');
const pendingAttachments = require('../../utils/pendingAttachments');
const strings = require('../../config/strings');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('request')
    .setDescription('Solicitar monedas a los docentes')
    .addAttachmentOption(option =>
      option
        .setName('attachment')
        .setDescription('Adjunto de referencia (archivo) - Opcional')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    try {
      // Ensure user exists
      await ensureUserExists(interaction.user.id, interaction.user.username);

      // If the user provided an attachment option with the command, store it
      // so the modal submit handler can access it.
      const attachmentOption = interaction.options.getAttachment('attachment');
      if (attachmentOption) {
        pendingAttachments.set(interaction.user.id, attachmentOption.url);
      }

      // Create modal
      const modal = new ModalBuilder()
        .setCustomId(`coinrequest_${interaction.user.id}`)
        .setTitle(strings.MODALS.REQUEST_TITLE);

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

      const firstRow = new ActionRowBuilder().addComponents(reasonInput);
      const secondRow = new ActionRowBuilder().addComponents(amountInput);
      const thirdRow = new ActionRowBuilder().addComponents(descriptionInput);

      modal.addComponents(firstRow, secondRow, thirdRow);

      await interaction.showModal(modal);
    } catch (error) {
      console.error('Error in coins request command:', error);
      await interaction.reply({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
