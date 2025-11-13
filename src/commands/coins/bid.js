const { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { checkTeacherRole } = require('../../utils/permissions');
const { formatDuration, replacePlaceholders } = require('../../utils/formatting');
const { CURSOS } = require('../../config/enums');
const config = require('../../config/config');
const strings = require('../../config/strings');

// Store active auctions
const activeAuctions = new Map();

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('bid')
    .setDescription('Crear una subasta (solo docentes)')
    .addStringOption(option =>
      option.setName('item_name')
        .setDescription('Nombre del artículo')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('starting_bid')
        .setDescription('Puja inicial mínima')
        .setRequired(true)
        .setMinValue(10))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duración en minutos')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1440)),
  
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

      const itemName = interaction.options.getString('item_name');
      const startingBid = interaction.options.getInteger('starting_bid');
      const duration = interaction.options.getInteger('duration');

      // Show curso selection menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`auctioncurso_${interaction.user.id}_${Date.now()}`)
        .setPlaceholder('Selecciona el curso para la subasta')
        .addOptions(
          CURSOS.map(curso => ({
            label: curso,
            value: curso
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: '🔨 Selecciona el curso (nivel) para esta subasta:',
        components: [row],
        ephemeral: true
      });

      // Wait for selection
      const filter = i => i.customId.startsWith('auctioncurso_') && i.user.id === interaction.user.id;
      
      try {
        const selection = await interaction.channel.awaitMessageComponent({
          filter,
          time: 60000
        });

        await selection.deferUpdate();

        const curso = selection.values[0];

        // Get announcement channel for curso
        const announcementChannelId = config.ANNOUNCEMENT_CHANNELS[curso];
        if (!announcementChannelId) {
          await interaction.editReply({
            content: `❌ No se encontró el canal de anuncios para ${curso}`,
            components: []
          });
          return;
        }

        const announcementChannel = await interaction.client.channels.fetch(announcementChannelId);

        await interaction.editReply({
          content: '⏳ Creando subasta...',
          components: []
        });

        const auctionId = `${Date.now()}_${interaction.user.id}`;
        
        // Create auction data
        const auctionData = {
          id: auctionId,
          item: itemName,
          currentBid: startingBid,
          topBidder: null,
          topBidderUsername: strings.PLACEHOLDERS.NONE,
          startTime: Date.now(),
          endTime: Date.now() + (duration * 60 * 1000),
          duration: duration,
          messageId: null,
          channelId: announcementChannel.id,
          curso: curso,
          ended: false
        };

        activeAuctions.set(auctionId, auctionData);

        // Create embed
        const embed = new EmbedBuilder()
          .setTitle(replacePlaceholders(strings.EMBEDS.AUCTION_TITLE, { item: itemName }))
          .setDescription(`**Curso:** ${curso}`)
          .setColor(0xe74c3c) // Red
          .addFields(
            {
              name: strings.FIELDS.CURRENT_BID,
              value: `**${startingBid} monedas**`,
              inline: true
            },
            {
              name: strings.FIELDS.TOP_BIDDER,
              value: strings.PLACEHOLDERS.NONE,
              inline: true
            },
            {
              name: strings.FIELDS.TIME_REMAINING,
              value: formatDuration(duration),
              inline: true
            }
          )
          .setTimestamp();

        // Create buttons
        const bidButton = new ButtonBuilder()
          .setCustomId(`bid_${auctionId}`)
          .setLabel(strings.BUTTONS.BID)
          .setStyle(ButtonStyle.Success);

        const endButton = new ButtonBuilder()
          .setCustomId(`end_${auctionId}`)
          .setLabel(strings.BUTTONS.END_AUCTION)
          .setStyle(ButtonStyle.Danger);

        const row2 = new ActionRowBuilder().addComponents(bidButton, endButton);

        const message = await announcementChannel.send({
          embeds: [embed],
          components: [row2]
        });

        auctionData.messageId = message.id;

        // Notify teacher
        await interaction.editReply({
          content: `✅ Subasta creada en el canal de anuncios de **${curso}**\n🔗 [Ver subasta](${message.url})`
        });

        // Start countdown timer
        const interval = setInterval(async () => {
          const auction = activeAuctions.get(auctionId);
          if (!auction || auction.ended) {
            clearInterval(interval);
            return;
          }

          const timeLeft = auction.endTime - Date.now();
          
          if (timeLeft <= 0) {
            clearInterval(interval);
            await endAuction(auctionId, interaction.client);
          } else {
            // Update time remaining
            const minutesLeft = Math.ceil(timeLeft / 60000);
            try {
              const updatedEmbed = EmbedBuilder.from(message.embeds[0])
                .spliceFields(2, 1, {
                  name: strings.FIELDS.TIME_REMAINING,
                  value: formatDuration(minutesLeft),
                  inline: true
                });

              await message.edit({ embeds: [updatedEmbed] });
            } catch (error) {
              console.error('Error updating auction timer:', error);
            }
          }
        }, 60000); // Update every minute

      } catch (error) {
        if (error.message?.includes('time')) {
          await interaction.editReply({
            content: '❌ Tiempo de espera agotado. Por favor, intenta de nuevo.',
            components: []
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in coins bid command:', error);
      const replyMethod = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
      await interaction[replyMethod]({
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};

// Helper function to end auction
async function endAuction(auctionId, client) {
  const auction = activeAuctions.get(auctionId);
  if (!auction || auction.ended) return;

  auction.ended = true;

  try {
    const channel = await client.channels.fetch(auction.channelId);
    const message = await channel.messages.fetch(auction.messageId);

    if (auction.topBidder) {
      const supabaseService = require('../../services/supabase');
      
      // Deduct coins from winner
      await supabaseService.removeCoins(auction.topBidder, auction.currentBid);

      // Update embed to show ended
      const endedEmbed = EmbedBuilder.from(message.embeds[0])
        .setTitle(strings.EMBEDS.AUCTION_ENDED_TITLE)
        .setColor(0x2ecc71); // Green

      await message.edit({
        embeds: [endedEmbed],
        components: [] // Remove buttons
      });

      // Crosspost (publish) the auction result if in announcement channel
      try {
        if (channel.type === 5) { // Announcement channel
          await message.crosspost();
          console.log('Auction message published (crossposted)');
        }
      } catch (error) {
        console.log('Could not crosspost auction message:', error);
      }

      // Announce winner
      await channel.send(
        `🎉 ¡Subasta finalizada!\n**Ganador:** <@${auction.topBidder}>\n**Precio final:** ${auction.currentBid} monedas`
      );

      // DM winner
      try {
        const winner = await client.users.fetch(auction.topBidder);
        const dmMessage = replacePlaceholders(strings.DM.AUCTION_WON, {
          item: auction.item,
          amount: auction.currentBid
        });
        await winner.send(dmMessage);
      } catch (error) {
        console.log('Could not send DM to winner:', error);
      }
    } else {
      await message.edit({
        content: '⚠️ Subasta finalizada sin postores.',
        components: []
      });
    }

    activeAuctions.delete(auctionId);
  } catch (error) {
    console.error('Error ending auction:', error);
  }
}

// Export helpers for button handlers
module.exports.activeAuctions = activeAuctions;
module.exports.endAuction = endAuction;
