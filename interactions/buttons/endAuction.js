const { checkTeacherRole } = require('../../utils/permissions');
const bidCommand = require('../../commands/coins/bid');
const strings = require('../../config/strings');

module.exports = {
  customId: 'end',
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

      const auctionId = interaction.customId.split('_')[1];

      // End auction
      await bidCommand.endAuction(auctionId, interaction.client);

      await interaction.followUp({
        content: '✅ Subasta finalizada',
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in end auction button handler:', error);
      await interaction.followUp({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
