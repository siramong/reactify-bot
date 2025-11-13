const supabaseService = require('../../services/supabase');
const strings = require('../../config/strings');

module.exports = {
  customId: 'resetconfirm',
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const confirmation = interaction.fields.getTextInputValue('confirmation');

      if (confirmation !== 'CONFIRMAR RESET') {
        await interaction.editReply({
          content: '❌ Confirmación incorrecta. El reset ha sido cancelado.'
        });
        return;
      }

      // Reset all coins
      await supabaseService.resetAllCoins();

      await interaction.editReply({
        content: strings.SUCCESS.COINS_RESET_ALL
      });
    } catch (error) {
      console.error('Error in reset confirm modal handler:', error);
      await interaction.editReply({
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};
