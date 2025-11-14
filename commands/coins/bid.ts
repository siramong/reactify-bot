import { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags, CommandInteraction, Message, StringSelectMenuInteraction } from 'discord.js';
import { checkTeacherRole } from '../../utils/permissions';
import { formatDuration, replacePlaceholders } from '../../utils/formatting';
import { NIVELES, Nivel } from '../../config/enums';
import config from '../../config/config';
import { EMBEDS, BUTTONS, FIELDS, ERRORS } from '../../config/strings';
import { getLogger } from '../../utils/logger';
import consoleLogger from '../../utils/consoleLogger';
import supabaseService from '../../services/supabase';

interface AuctionData {
  itemName: string;
  currentBid: number;
  topBidder: string | null;
  topBidderName: string | null;
  endTime: number;
  duration: number;
  nivel: Nivel;
  createdBy: string;
  messageId: string;
  channelId: string;
  timer: NodeJS.Timeout | null;
}

// Store active auctions
const activeAuctions = new Map<string, AuctionData>();

export default {
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
  
  async execute(interaction: CommandInteraction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member as any)) {
        await interaction.reply({
          content: ERRORS.NO_PERMISSION,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const itemName = interaction.options.get('item_name', true).value as string;
      const startingBid = interaction.options.get('starting_bid', true).value as number;
      const duration = interaction.options.get('duration', true).value as number;

      // Show nivel selection menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`auctionnivel_${interaction.user.id}_${Date.now()}`)
        .setPlaceholder('Selecciona el nivel para la subasta')
        .addOptions(
          NIVELES.map(nivel => ({
            label: nivel,
            value: nivel
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      const response = await interaction.reply({
        content: '`ℹ️` Selecciona el nivel para la subasta:',
        components: [row],
        flags: MessageFlags.Ephemeral,
        fetchReply: true
      });

      // Store auction info temporarily
      const tempKey = `temp_${interaction.user.id}_${Date.now()}`;
      (activeAuctions as any)[tempKey] = {
        itemName,
        startingBid,
        duration,
        createdBy: interaction.user.id
      };

      // Wait for nivel selection
      const collector = (response as Message).createMessageComponentCollector({
        filter: (i: any) => i.user.id === interaction.user.id && i.customId.startsWith('auctionnivel'),
        time: 60000,
        max: 1
      });

      collector.on('collect', async (i: StringSelectMenuInteraction) => {
        const selectedNivel = i.values[0] as Nivel;
        const tempData = (activeAuctions as any)[tempKey];
        delete (activeAuctions as any)[tempKey];

        await i.update({
          content: '`⏳` Creando subasta...',
          components: []
        });

        try {
          await createAuction(
            i,
            tempData.itemName,
            tempData.startingBid,
            tempData.duration,
            selectedNivel,
            tempData.createdBy
          );
        } catch (error) {
          consoleLogger.error('SUBASTA', 'Error creando subasta', error as Error);
          await i.editReply({
            content: ERRORS.DATABASE_ERROR
          });
        }
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.editReply({
            content: '`❌` Selección de nivel cancelada por timeout.',
            components: []
          });
          delete (activeAuctions as any)[tempKey];
        }
      });
    } catch (error) {
      consoleLogger.error('COMANDO', 'Error en coins bid', error as Error);
      await interaction.reply({
        content: ERRORS.DATABASE_ERROR,
        flags: MessageFlags.Ephemeral
      });
    }
  },

  // Expose active auctions for button handlers
  activeAuctions,
  formatAuctionEmbed,
  endAuction
};

async function createAuction(
  interaction: StringSelectMenuInteraction,
  itemName: string,
  startingBid: number,
  duration: number,
  nivel: Nivel,
  createdBy: string
): Promise<void> {
  const channelId = config.ANNOUNCEMENT_CHANNELS[nivel];
  
  if (!channelId) {
    await interaction.editReply({
      content: `\`❌\` Canal de anuncios para ${nivel} no configurado.`
    });
    return;
  }

  const channel = await interaction.client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    await interaction.editReply({
      content: `\`❌\` No se pudo acceder al canal de anuncios.`
    });
    return;
  }

  const endTime = Date.now() + duration * 60 * 1000;
  const auctionId = `auction_${Date.now()}`;

  // Create auction embed
  const embed = formatAuctionEmbed(itemName, startingBid, null, null, endTime, false);

  // Create buttons
  const bidButton = new ButtonBuilder()
    .setCustomId(`auction_${auctionId}`)
    .setLabel(BUTTONS.BID)
    .setStyle(ButtonStyle.Primary);

  const endButton = new ButtonBuilder()
    .setCustomId(`endauction_${auctionId}`)
    .setLabel(BUTTONS.END_AUCTION)
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(bidButton, endButton);

  const auctionMessage = await (channel as any).send({
    embeds: [embed],
    components: [row]
  });

  // Store auction data
  activeAuctions.set(auctionId, {
    itemName,
    currentBid: startingBid,
    topBidder: null,
    topBidderName: null,
    endTime,
    duration,
    nivel,
    createdBy,
    messageId: auctionMessage.id,
    channelId: channel.id,
    timer: null
  });

  // Set timer to end auction
  const timer = setTimeout(async () => {
    await endAuction(auctionId, interaction.client);
  }, duration * 60 * 1000);

  activeAuctions.get(auctionId)!.timer = timer;

  // Log auction creation
  const logger = getLogger();
  await logger.logTransaction({
    type: 'AUCTION_CREATED',
    userId: createdBy,
    performedBy: createdBy,
    itemName,
    startingBid,
    duration,
    nivel
  });

  consoleLogger.success('SUBASTA', `Creada: ${itemName} - ${nivel}`);

  await interaction.editReply({
    content: `\`✅\` Subasta creada en el canal de **${nivel}**`
  });
}

function formatAuctionEmbed(
  itemName: string,
  currentBid: number,
  topBidder: string | null,
  topBidderName: string | null,
  endTime: number,
  ended: boolean
): EmbedBuilder {
  const title = ended ? replacePlaceholders(EMBEDS.AUCTION_ENDED_TITLE, { item: itemName }) : replacePlaceholders(EMBEDS.AUCTION_TITLE, { item: itemName });
  
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(ended ? 0x95a5a6 : 0x9b59b6) // Gray if ended, Purple if active
    .addFields(
      {
        name: FIELDS.CURRENT_BID,
        value: `${currentBid} monedas`,
        inline: true
      },
      {
        name: FIELDS.TOP_BIDDER,
        value: topBidder ? `<@${topBidder}>` : 'Ninguno',
        inline: true
      }
    )
    .setTimestamp();

  if (!ended) {
    const timeRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 60000));
    embed.addFields({
      name: FIELDS.TIME_REMAINING,
      value: formatDuration(timeRemaining),
      inline: true
    });
  }

  return embed;
}

async function endAuction(auctionId: string, client: any): Promise<void> {
  const auction = activeAuctions.get(auctionId);
  if (!auction) return;

  // Clear timer
  if (auction.timer) {
    clearTimeout(auction.timer);
  }

  // Get channel and message
  try {
    const channel = await client.channels.fetch(auction.channelId);
    if (!channel) return;

    const message = await (channel as any).messages.fetch(auction.messageId);
    if (!message) return;

    // Update embed to show auction ended
    const endedEmbed = formatAuctionEmbed(
      auction.itemName,
      auction.currentBid,
      auction.topBidder,
      auction.topBidderName,
      auction.endTime,
      true
    );

    await message.edit({
      embeds: [endedEmbed],
      components: [] // Remove buttons
    });

    // If there was a winner, notify them and deduct coins
    if (auction.topBidder) {
      try {
        await supabaseService.removeCoins(auction.topBidder, auction.currentBid);
        
        const winner = await client.users.fetch(auction.topBidder);
        await winner.send(
          replacePlaceholders(FIELDS.CURRENT_BID, {
            item: auction.itemName,
            amount: auction.currentBid
          })
        );

        consoleLogger.transaction('SUBASTA GANADA', auction.currentBid, auction.topBidderName || 'Unknown');
      } catch (error) {
        consoleLogger.error('SUBASTA', 'Error procesando ganador', error as Error);
      }
    }

    // Log auction end
    const logger = getLogger();
    await logger.logTransaction({
      type: 'AUCTION_ENDED',
      userId: auction.createdBy,
      performedBy: auction.createdBy,
      itemName: auction.itemName,
      winnerId: auction.topBidder || undefined,
      finalPrice: auction.currentBid
    });

    consoleLogger.success('SUBASTA', `Finalizada: ${auction.itemName}`);
  } catch (error) {
    consoleLogger.error('SUBASTA', 'Error finalizando subasta', error as Error);
  } finally {
    activeAuctions.delete(auctionId);
  }
}
