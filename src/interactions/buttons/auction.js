const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ensureUserExists } = require('../../utils/userManager');
const { checkTeacherRole } = require('../../utils/permissions');
const bidCommand = require('../../commands/coins/bid');
const strings = require('../../config/strings');

module.exports = {
  customId: 'bid',
  async execute(interaction) {
    try {
      const action = interaction.customId.split('_')[0];
      const auctionId = interaction.customId.split('_')[1];

      if (action === 'bid') {
        // Ensure user exists
        await ensureUserExists(interaction.user.id, interaction.user.username);

        // Get auction data
        const auction = bidCommand.activeAuctions.get(auctionId);
        
        if (!auction) {
          await interaction.reply({
            content: '❌ Esta subasta no existe o ha finalizado.',
            ephemeral: true
          });
          return;
        }

        if (auction.ended) {
          await interaction.reply({
            content: strings.ERRORS.AUCTION_ENDED,
            ephemeral: true
          });
          return;
        }

        // Show modal for bid amount
        const modal = new ModalBuilder()
          .setCustomId(`bidamount_${auctionId}`)
          .setTitle(strings.MODALS.BID_TITLE);

        const amountInput = new TextInputBuilder()
          .setCustomId('amount')
          .setLabel(`Cantidad (mínimo: ${auction.currentBid + 10} monedas)`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(`${auction.currentBid + 10}`)
          .setMaxLength(6);

        const row = new ActionRowBuilder().addComponents(amountInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      } else if (action === 'end') {
        // Check teacher permission
        if (!checkTeacherRole(interaction.member)) {
          await interaction.reply({
            content: strings.ERRORS.NO_PERMISSION,
            ephemeral: true
          });
          return;
        }

        await interaction.deferUpdate();

        // End auction
        await bidCommand.endAuction(auctionId, interaction.client);

        await interaction.followUp({
          content: '✅ Subasta finalizada',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error in auction button handler:', error);
      await interaction.reply({
        content: strings.ERRORS.DATABASE_ERROR,
        ephemeral: true
      });
    }
  },
};
