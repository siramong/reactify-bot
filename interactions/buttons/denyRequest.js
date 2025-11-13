const { EmbedBuilder } = require('discord.js');
const { checkTeacherRole } = require('../../utils/permissions');
const strings = require('../../config/strings');

module.exports = {
  customId: 'deny',
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

      if (!userId) {
        await interaction.followUp({
          content: '❌ Error al procesar la solicitud.',
          ephemeral: true
        });
        return;
      }

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
        await user.send(`❌ Tu solicitud de ${amount} monedas ha sido rechazada.`);
      } catch (error) {
        console.log('Could not send DM to user:', error);
      }

      await interaction.followUp({
        content: '✅ Solicitud rechazada',
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in deny button handler:', error);
      await interaction.followUp({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
