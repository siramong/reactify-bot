const { EmbedBuilder } = require('discord.js');
const supabaseService = require('../../services/supabase');
const config = require('../../config/config');
const bidCommand = require('../../commands/coins/bid');
const { replacePlaceholders } = require('../../utils/formatting');
const strings = require('../../config/strings');

module.exports = {
  customId: 'bidamount',
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const auctionId = interaction.customId.split('_')[1];
      const amountStr = interaction.fields.getTextInputValue('amount');

      // Parse bid amount
      const bidAmount = parseInt(amountStr);
      
      if (isNaN(bidAmount) || bidAmount <= 0) {
        await interaction.editReply({
          content: strings.ERRORS.INVALID_AMOUNT
        });
        return;
      }

      // Get auction data
      const auction = bidCommand.activeAuctions.get(auctionId);
      
      if (!auction) {
        await interaction.editReply({
          content: '❌ Esta subasta no existe o ha finalizado.'
        });
        return;
      }

      if (auction.ended) {
        await interaction.editReply({
          content: strings.ERRORS.AUCTION_ENDED
        });
        return;
      }

      // Validate minimum bid
      const minBid = auction.currentBid + config.BID_INCREMENT;
      if (bidAmount < minBid) {
        const errorMsg = replacePlaceholders(strings.ERRORS.BID_TOO_LOW, {
          minimum: minBid
        });
        await interaction.editReply({
          content: errorMsg
        });
        return;
      }

      // Check user has sufficient coins
      const user = await supabaseService.getUser(interaction.user.id);
      if (!user || user.amount < bidAmount) {
        await interaction.editReply({
          content: strings.ERRORS.INSUFFICIENT_COINS
        });
        return;
      }

      // Store previous bidder
      const previousBidder = auction.topBidder;

      // Update auction
      auction.currentBid = bidAmount;
      auction.topBidder = interaction.user.id;
      auction.topBidderUsername = interaction.user.username;

      // Update auction message
      try {
        const channel = await interaction.client.channels.fetch(auction.channelId);
        const message = await channel.messages.fetch(auction.messageId);

        const updatedEmbed = EmbedBuilder.from(message.embeds[0])
          .spliceFields(0, 2,
            {
              name: strings.FIELDS.CURRENT_BID,
              value: `**${bidAmount} monedas**`,
              inline: true
            },
            {
              name: strings.FIELDS.TOP_BIDDER,
              value: interaction.user.toString(),
              inline: true
            }
          );

        await message.edit({ embeds: [updatedEmbed] });
      } catch (error) {
        console.error('Error updating auction message:', error);
      }

      // Notify previous bidder
      if (previousBidder && previousBidder !== interaction.user.id) {
        try {
          const prevUser = await interaction.client.users.fetch(previousBidder);
          const dmMessage = replacePlaceholders(strings.DM.AUCTION_OUTBID, {
            item: auction.item
          });
          await prevUser.send(dmMessage);
        } catch (error) {
          console.log('Could not send DM to previous bidder:', error);
        }
      }

      await interaction.editReply({
        content: `✅ ¡Puja realizada! Has pujado **${bidAmount} monedas** por **${auction.item}**`
      });
    } catch (error) {
      console.error('Error in bid amount modal handler:', error);
      await interaction.editReply({
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};
