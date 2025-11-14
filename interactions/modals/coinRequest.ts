import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ModalSubmitInteraction, TextChannel } from 'discord.js';
import supabaseService from '../../services/supabase';
import config from '../../config/config';
import { EMBEDS, FIELDS, BUTTONS, PLACEHOLDERS, SUCCESS, ERRORS } from '../../config/strings';
import consoleLogger from '../../utils/consoleLogger';
import * as pendingAttachments from '../../utils/pendingAttachments';

export default {
  customId: 'coinrequest',
  async execute(interaction: ModalSubmitInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get form values
      const reason = interaction.fields.getTextInputValue('reason');
      const amountStr = interaction.fields.getTextInputValue('amount');
      const description = interaction.fields.getTextInputValue('description') || PLACEHOLDERS.NONE;
      let fieldsAttachment: string | null = null;
      try {
        fieldsAttachment = interaction.fields.getTextInputValue('attachment');
      } catch (e) {
        fieldsAttachment = null;
      }

      // If the modal no longer contains an attachment field, try the
      // temporary in-memory store where the command may have saved it.
      const storedAttachment = pendingAttachments.getAndDelete(interaction.user.id);
      const attachment = fieldsAttachment || (storedAttachment ? String(storedAttachment) : null) || PLACEHOLDERS.NONE;

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
      const fields: any[] = [
        {
          name: FIELDS.USER,
          value: interaction.user.toString(),
          inline: true
        },
        {
          name: FIELDS.AMOUNT,
          value: `${amount}`,
          inline: true
        },
        {
          name: FIELDS.NIVEL,
          value: user?.curso || '*No configurado*',
          inline: true
        },
        {
          name: FIELDS.REASON,
          value: reason,
          inline: false
        },
        {
          name: FIELDS.DESCRIPTION,
          value: description,
          inline: false
        }
      ];

      // Only include proof field if there's a real attachment
      const hasAttachment = attachment && attachment !== PLACEHOLDERS.NONE;
      if (hasAttachment) {
        fields.push({
          name: FIELDS.PROOF,
          value: attachment,
          inline: false
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(EMBEDS.REQUEST_TITLE)
        .setColor(0x3498db) // Blue
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: `ID: ${interaction.user.id}` });

      // Only set image if we have a real attachment URL
      if (hasAttachment) {
        embed.setImage(attachment!);
      }

      // Create buttons
      const requestId = `${Date.now()}_${interaction.user.id}`;
      
      const approveButton = new ButtonBuilder()
        .setCustomId(`approve_${requestId}`)
        .setLabel(BUTTONS.APPROVE)
        .setStyle(ButtonStyle.Success);

      const denyButton = new ButtonBuilder()
        .setCustomId(`deny_${requestId}`)
        .setLabel(BUTTONS.DENY)
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveButton, denyButton);

      // Send to teacher channel
      const teacherChannel = await interaction.client.channels.fetch(config.TEACHER_CHANNEL_ID!) as TextChannel;
      await teacherChannel.send({
        embeds: [embed],
        components: [row]
      });

      consoleLogger.info('SOLICITUD', `Monedas solicitadas: ${amount} por ${interaction.user.tag}`);

      // Respond to user
      await interaction.editReply({
        content: SUCCESS.REQUEST_SENT
      });
    } catch (error) {
      consoleLogger.error('MODAL', 'Error en solicitud de monedas', error as Error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR
      });
    }
  },
};
