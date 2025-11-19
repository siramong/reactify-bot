const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('ranking')
    .setDescription('Ver el ranking mensual de tu casa'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();

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

      // Get monthly ranking
      const ranking = await housesService.getHouseMonthlyRanking(house.id);

      const now = new Date();
      const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

      const embed = new EmbedBuilder()
        .setTitle(`${house.emoji || '🏠'} Ranking de ${house.name}`)
        .setDescription(`**Ranking del mes de ${monthName}**\n\n${ranking.length === 0 ? 'Aún no hay puntos registrados este mes.' : ''}`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .setTimestamp();

      if (ranking.length > 0) {
        const top10 = ranking.slice(0, 10);
        
        const rankingText = top10.map((member, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const username = member.house_members?.[0]?.username || 'Usuario';
          return `${medal} **${username}** - ${member.points} puntos`;
        }).join('\n');

        embed.addFields({
          name: '🏆 Top 10',
          value: rankingText,
          inline: false
        });

        // Find user's position
        const userPosition = ranking.findIndex(m => m.userId === interaction.user.id);
        if (userPosition !== -1 && userPosition > 9) {
          const userPoints = ranking[userPosition];
          const username = userPoints.house_members?.[0]?.username || interaction.user.username;
          embed.addFields({
            name: '📊 Tu Posición',
            value: `**#${userPosition + 1}** - ${username} - ${userPoints.points} puntos`,
            inline: false
          });
        }
      }

      embed.setFooter({ text: `Total de miembros: ${ranking.length}` });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en house ranking', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener el ranking.'
      });
    }
  },
};
