const { checkTeacherRole } = require('../../utils/permissions');
const supabaseService = require('../../services/supabase');
const { replacePlaceholders } = require('../../utils/formatting');
const strings = require('../../config/strings');

module.exports = {
  customId: 'confirmreset',
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

      const parts = interaction.customId.split('_');
      const action = parts[1]; // 'user' or 'cancel'

      if (action === 'cancel') {
        await interaction.update({
          content: '❌ Reset cancelado',
          components: []
        });
        return;
      }

      if (action === 'user') {
        await interaction.deferUpdate();

        const userId = parts[2];

        // Reset user coins
        await supabaseService.resetUserCoins(userId);

        try {
          const user = await interaction.client.users.fetch(userId);
          const response = replacePlaceholders(strings.SUCCESS.COINS_RESET_USER, {
            user: user.username
          });

          await interaction.editReply({
            content: response,
            components: []
          });
        } catch (error) {
          await interaction.editReply({
            content: '✅ Las monedas del usuario han sido reseteadas a 0',
            components: []
          });
        }
      }
    } catch (error) {
      console.error('Error in confirm reset button handler:', error);
      await interaction.followUp({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
