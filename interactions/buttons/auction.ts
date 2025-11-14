import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonInteraction } from 'discord.js';
import { ensureUserExists } from '../../utils/userManager';
import { checkTeacherRole } from '../../utils/permissions';
import bidCommand from '../../commands/coins/bid';
import { MODALS, ERRORS } from '../../config/strings';

export default {
  customId: 'auction',
  async execute(interaction: ButtonInteraction) {
    try {
      const parts = interaction.customId.split('_');
      const action = parts[0];
      const auctionId = parts.slice(1).join('_');

      if (action === 'auction') {
        // Ensure user exists
        await ensureUserExists(interaction.user.id, interaction.user.username);

        // Get auction data
        const auction = bidCommand.activeAuctions.get(auctionId);
        
        if (!auction) {
          await interaction.reply({
            content: '❌ Esta subasta no existe o ha finalizado.',
            flags: 64 // Ephemeral
          });
          return;
        }

        // Show modal for bid amount
        const modal = new ModalBuilder()
          .setCustomId(`bidamount_${auctionId}`)
          .setTitle(MODALS.BID_TITLE);

        const amountInput = new TextInputBuilder()
          .setCustomId('amount')
          .setLabel(`Cantidad (mínimo: ${auction.currentBid + 10} monedas)`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(`${auction.currentBid + 10}`)
          .setMaxLength(6);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }
    } catch (error) {
      console.error('Error in auction button handler:', error);
      await interaction.reply({
        content: ERRORS.DATABASE_ERROR,
        flags: 64 // Ephemeral
      });
    }
  },
};
