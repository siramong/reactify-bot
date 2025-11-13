const { EmbedBuilder } = require('discord.js');
const supabaseService = require('../../services/supabase');
const { checkTeacherRole } = require('../../utils/permissions');
const { replacePlaceholders } = require('../../utils/formatting');
const strings = require('../../config/strings');

module.exports = {
  customId: 'approve',
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

      if (!userId || !amount) {
        await interaction.followUp({
          content: '❌ Error al procesar la solicitud.',
          ephemeral: true
        });
        return;
      }

      // Add coins to user
      await supabaseService.addCoins(userId, amount);

      // Update embed to show approved
      const updatedEmbed = EmbedBuilder.from(embed)
        .setColor(0x2ecc71) // Green
        .setFooter({ text: `Aprobado por ${interaction.user.username}` });

      await interaction.message.edit({
        embeds: [updatedEmbed],
        components: [] // Remove buttons
      });

      // Try to DM the user
      try {
        const user = await interaction.client.users.fetch(userId);
        const reasonField = fields.find(f => f.name === strings.FIELDS.REASON);
        const reason = reasonField?.value || strings.PLACEHOLDERS.NOT_SPECIFIED;
        
        const dmMessage = replacePlaceholders(strings.DM.COINS_RECEIVED, {
          amount: amount,
          reason: reason
        });
        await user.send(dmMessage);
      } catch (error) {
        console.log('Could not send DM to user:', error);
      }

      await interaction.followUp({
        content: '✅ Solicitud aprobada',
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in approve button handler:', error);
      await interaction.followUp({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
