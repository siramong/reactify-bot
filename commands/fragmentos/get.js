const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('get')
    .setDescription('Ver tu balance de fragmentos'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get user's fragmentos
      const fragmentos = await housesService.getUserFragmentos(interaction.user.id);
      
      // Get user's house
      const userHouse = await housesService.getUserHouse(interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('💎 Tus Fragmentos')
        .setDescription('Los fragmentos son la moneda de las casas que puedes convertir a monedas regulares.')
        .setColor(0x9B59B6)
        .addFields(
          {
            name: '💰 Balance',
            value: `**${fragmentos.amount || 0}** fragmentos`,
            inline: true
          },
          {
            name: '🏠 Casa',
            value: userHouse ? `${userHouse.houses.emoji || '🏠'} ${userHouse.houses.name}` : '*Sin casa*',
            inline: true
          }
        )
        .setFooter({ text: 'Los fragmentos se obtienen por logros y participación en eventos' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en fragmentos get', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener tus fragmentos.'
      });
    }
  },
};
