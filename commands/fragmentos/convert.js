const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const supabaseService = require('../../services/supabase');
const { ensureUserExists } = require('../../utils/userManager');
const log = require('../../utils/consoleLogger');

const CONVERSION_RATE = 10; // 10 fragmentos = 1 moneda

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('convert')
    .setDescription('Convierte fragmentos a monedas')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Cantidad de fragmentos a convertir')
        .setRequired(true)
        .setMinValue(1)),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const amount = interaction.options.getInteger('amount');
      
      // Ensure user exists in coins table
      await ensureUserExists(interaction.user.id, interaction.user.username);

      // Get user's fragmentos
      const fragmentos = await housesService.getUserFragmentos(interaction.user.id);
      
      if (!fragmentos || fragmentos.amount < amount) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Fragmentos Insuficientes')
          .setDescription(`Tienes **${fragmentos?.amount || 0}** fragmentos, pero intentas convertir **${amount}** fragmentos.`)
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Calculate coins to receive
      const coinsToReceive = Math.floor(amount / CONVERSION_RATE);
      
      if (coinsToReceive === 0) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Cantidad Insuficiente')
          .setDescription(`Necesitas al menos **${CONVERSION_RATE}** fragmentos para convertir a 1 moneda.\n\nTasa de conversión: **${CONVERSION_RATE} fragmentos = 1 moneda**`)
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Update fragmentos
      const newFragmentos = fragmentos.amount - amount;
      await housesService.updateFragmentos(interaction.user.id, newFragmentos, fragmentos.houseId);

      // Add coins
      await supabaseService.addCoins(interaction.user.id, coinsToReceive);

      const embed = new EmbedBuilder()
        .setTitle('✅ Conversión Exitosa')
        .setDescription(`Has convertido **${amount}** fragmentos en **${coinsToReceive}** monedas.`)
        .setColor(0x00FF00)
        .addFields(
          {
            name: '💎 Fragmentos Restantes',
            value: `**${newFragmentos}** fragmentos`,
            inline: true
          },
          {
            name: '💰 Monedas Recibidas',
            value: `**${coinsToReceive}** monedas`,
            inline: true
          }
        )
        .setFooter({ text: `Tasa de conversión: ${CONVERSION_RATE} fragmentos = 1 moneda` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      log.database('CONVERTIR FRAGMENTOS', `${interaction.user.username}: ${amount} fragmentos -> ${coinsToReceive} monedas`);

    } catch (error) {
      log.error('COMANDO', 'Error en fragmentos convert', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al convertir fragmentos.'
      });
    }
  },
};
