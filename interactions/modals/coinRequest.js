const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const supabaseService = require('../../services/supabase');
const config = require('../../config/config');
const strings = require('../../config/strings');
const log = require('../../utils/consoleLogger');

module.exports = {
  customId: 'coinrequest',
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get form values
      const reason = interaction.fields.getTextInputValue('reason');
      const amountStr = interaction.fields.getTextInputValue('amount');
      const description = interaction.fields.getTextInputValue('description') || strings.PLACEHOLDERS.NONE;
      const fieldsAttachment = (interaction.fields.getTextInputValue && (() => {
        try { return interaction.fields.getTextInputValue('attachment'); } catch (e) { return null; }
      })()) || null;

      // If the modal no longer contains an attachment field, try the
      // temporary in-memory store where the command may have saved it.
      const pendingAttachments = require('../../utils/pendingAttachments');
      const storedAttachment = pendingAttachments.getAndDelete(interaction.user.id);
      const attachment = fieldsAttachment || storedAttachment || strings.PLACEHOLDERS.NONE;

      // Parse amount
      const amount = parseInt(amountStr);
      
      if (isNaN(amount) || amount < 1 || amount > 1000) {
        await interaction.editReply({
          content: '`❌` La cantidad debe ser un número entre 1 y 1000.'
        });
        return;
      }

      // Get user data
      const user = await supabaseService.getUser(interaction.user.id);

      // Create embed for teacher channel
      const fields = [
        {
          name: strings.FIELDS.USER,
          value: interaction.user.toString(),
          inline: true
        },
        {
          name: strings.FIELDS.AMOUNT,
          value: `${amount}`,
          inline: true
        },
        {
          name: strings.FIELDS.NIVEL,
          value: user?.curso || '*No configurado*',
          inline: true
        },
        {
          name: strings.FIELDS.REASON,
          value: reason,
          inline: false
        },
        {
          name: strings.FIELDS.DESCRIPTION,
          value: description,
          inline: false
        }
      ];

      // Only include proof field if there's a real attachment
      const hasAttachment = attachment && attachment !== strings.PLACEHOLDERS.NONE;
      if (hasAttachment) {
        fields.push({
          name: strings.FIELDS.PROOF,
          value: attachment,
          inline: false
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(strings.EMBEDS.REQUEST_TITLE)
        .setColor(0x3498db) // Blue
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: `ID: ${interaction.user.id}` });

      // Only set image if we have a real attachment URL
      if (hasAttachment) {
        embed.setImage(attachment);
      }

      // Create buttons
      const requestId = `${Date.now()}_${interaction.user.id}`;
      
      const approveButton = new ButtonBuilder()
        .setCustomId(`approve_${requestId}`)
        .setLabel(strings.BUTTONS.APPROVE)
        .setStyle(ButtonStyle.Success);

      const denyButton = new ButtonBuilder()
        .setCustomId(`deny_${requestId}`)
        .setLabel(strings.BUTTONS.DENY)
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(approveButton, denyButton);

      // Send to teacher channel
      const teacherChannel = await interaction.client.channels.fetch(config.TEACHER_CHANNEL_ID);
      await teacherChannel.send({
        embeds: [embed],
        components: [row]
      });

      log.info('SOLICITUD', `Monedas solicitadas: ${amount} por ${interaction.user.tag}`);

      // Respond to user
      await interaction.editReply({
        content: strings.SUCCESS.REQUEST_SENT
      });
    } catch (error) {
      log.error('MODAL', 'Error en solicitud de monedas', error);
      await interaction.editReply({
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};
