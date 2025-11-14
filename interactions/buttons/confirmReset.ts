import { ButtonInteraction } from 'discord.js';
import { checkTeacherRole } from '../../utils/permissions';
import supabaseService from '../../services/supabase';
import { replacePlaceholders } from '../../utils/formatting';
import { SUCCESS, ERRORS } from '../../config/strings';

export default {
  customId: 'confirmreset',
  async execute(interaction: ButtonInteraction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member as any)) {
        await interaction.reply({
          content: ERRORS.NO_PERMISSION,
          flags: 64 // Ephemeral
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
          const response = replacePlaceholders(SUCCESS.COINS_RESET_USER, {
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
        content: ERRORS.DATABASE_ERROR,
        flags: 64 // Ephemeral
      });
    }
  },
};
