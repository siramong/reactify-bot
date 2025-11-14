import { ModalSubmitInteraction } from 'discord.js';
import supabaseService from '../../services/supabase';
import { SUCCESS, ERRORS } from '../../config/strings';

export default {
  customId: 'resetconfirm',
  async execute(interaction: ModalSubmitInteraction) {
    try {
      await interaction.deferReply({ flags: 64 }); // Ephemeral

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
        content: SUCCESS.COINS_RESET_ALL
      });
    } catch (error) {
      console.error('Error in reset confirm modal handler:', error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR
      });
    }
  },
};
