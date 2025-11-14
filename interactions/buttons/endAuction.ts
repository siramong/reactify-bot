import { ButtonInteraction } from 'discord.js';
import { checkTeacherRole } from '../../utils/permissions';
import bidCommand from '../../commands/coins/bid';
import { ERRORS } from '../../config/strings';

export default {
  customId: 'endauction',
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

      await interaction.deferUpdate();

      const auctionId = interaction.customId.split('_').slice(1).join('_');

      // End auction
      await bidCommand.endAuction(auctionId, interaction.client);

      await interaction.followUp({
        content: '✅ Subasta finalizada',
        flags: 64 // Ephemeral
      });
    } catch (error) {
      console.error('Error in end auction button handler:', error);
      await interaction.followUp({
        content: ERRORS.DATABASE_ERROR,
        flags: 64 // Ephemeral
      });
    }
  },
};
