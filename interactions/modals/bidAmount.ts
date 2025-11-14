import { EmbedBuilder, ModalSubmitInteraction, TextChannel, Message } from 'discord.js';
import supabaseService from '../../services/supabase';
import config from '../../config/config';
import bidCommand from '../../commands/coins/bid';
import { replacePlaceholders } from '../../utils/formatting';
import { FIELDS, ERRORS, DM } from '../../config/strings';

export default {
  customId: 'bidamount',
  async execute(interaction: ModalSubmitInteraction) {
    try {
      await interaction.deferReply({ flags: 64 }); // Ephemeral

      const auctionId = interaction.customId.split('_').slice(1).join('_');
      const amountStr = interaction.fields.getTextInputValue('amount');

      // Parse bid amount
      const bidAmount = parseInt(amountStr);
      
      if (isNaN(bidAmount) || bidAmount <= 0) {
        await interaction.editReply({
          content: ERRORS.INVALID_AMOUNT
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

      // Validate minimum bid
      const minBid = auction.currentBid + config.BID_INCREMENT;
      if (bidAmount < minBid) {
        const errorMsg = replacePlaceholders(ERRORS.BID_TOO_LOW, {
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
          content: ERRORS.INSUFFICIENT_COINS
        });
        return;
      }

      // Store previous bidder
      const previousBidder = auction.topBidder;

      // Update auction
      auction.currentBid = bidAmount;
      auction.topBidder = interaction.user.id;
      auction.topBidderName = interaction.user.username;

      // Update auction message
      try {
        const channel = await interaction.client.channels.fetch(auction.channelId) as TextChannel;
        const message = await channel.messages.fetch(auction.messageId) as Message;

        const updatedEmbed = EmbedBuilder.from(message.embeds[0])
          .spliceFields(0, 2,
            {
              name: FIELDS.CURRENT_BID,
              value: `**${bidAmount} monedas**`,
              inline: true
            },
            {
              name: FIELDS.TOP_BIDDER,
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
          const dmMessage = replacePlaceholders(DM.AUCTION_OUTBID, {
            item: auction.itemName
          });
          await prevUser.send(dmMessage);
        } catch (error) {
          console.log('Could not send DM to previous bidder:', error);
        }
      }

      await interaction.editReply({
        content: `✅ ¡Puja realizada! Has pujado **${bidAmount} monedas** por **${auction.itemName}**`
      });
    } catch (error) {
      console.error('Error in bid amount modal handler:', error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR
      });
    }
  },
};
