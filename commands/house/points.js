const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('points')
    .setDescription('Ver tus puntos de casa del mes'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get user's house
      const userHouse = await housesService.getUserHouse(interaction.user.id);
      
      if (!userHouse) {
        const embed = new EmbedBuilder()
          .setTitle('❌ No perteneces a ninguna casa')
          .setDescription('Usa `/house join` para unirte a una casa.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      const house = userHouse.houses;

      // Get user's monthly points
      const monthlyPoints = await housesService.getUserMonthlyPoints(interaction.user.id, house.id);

      // Get ranking to find position
      const ranking = await housesService.getHouseMonthlyRanking(house.id);
      const position = ranking.findIndex(m => m.userId === interaction.user.id) + 1;

      const now = new Date();
      const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

      const embed = new EmbedBuilder()
        .setTitle('📊 Tus Puntos de Casa')
        .setDescription(`**${house.emoji || '🏠'} ${house.name}**`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .addFields(
          {
            name: '🏆 Puntos del Mes',
            value: `**${monthlyPoints.points || 0}** puntos`,
            inline: true
          },
          {
            name: '📈 Posición en Casa',
            value: position > 0 ? `**#${position}**` : '*Sin posición*',
            inline: true
          },
          {
            name: '📅 Mes',
            value: monthName,
            inline: true
          }
        )
        .setFooter({ text: 'Los puntos se reinician cada mes' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en house points', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener tus puntos.'
      });
    }
  },
};
