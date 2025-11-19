const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('info')
    .setDescription('Ver información de tu casa'),
  
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
      
      // Get house members count
      const members = await housesService.getHouseMembers(house.id);
      const leaders = members.filter(m => m.role === 'leader');
      const organizers = members.filter(m => m.role === 'event_organizer');

      // Get monthly ranking
      const ranking = await housesService.getHouseMonthlyRanking(house.id);
      const topMembers = ranking.slice(0, 5);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${house.emoji || '🏠'} ${house.name}`)
        .setDescription(house.description || 'Sin descripción')
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .addFields(
          {
            name: '👥 Miembros',
            value: `**${members.length}** miembros`,
            inline: true
          },
          {
            name: '🏆 Puntos Totales',
            value: `**${house.points || 0}** puntos`,
            inline: true
          },
          {
            name: '⭐ Tu Rol',
            value: userHouse.role === 'leader' ? '**Líder de la Casa**' : 
                   userHouse.role === 'event_organizer' ? '**Organizador de Eventos**' : 
                   '**Miembro**',
            inline: true
          }
        );

      // Add leaders
      if (leaders.length > 0) {
        embed.addFields({
          name: '👑 Líderes',
          value: leaders.map(l => `• ${l.username}`).join('\n') || 'Ninguno',
          inline: true
        });
      }

      // Add organizers
      if (organizers.length > 0) {
        embed.addFields({
          name: '🎯 Organizadores de Eventos',
          value: organizers.map(o => `• ${o.username}`).join('\n') || 'Ninguno',
          inline: true
        });
      }

      // Add top members this month
      if (topMembers.length > 0) {
        embed.addFields({
          name: '🌟 Top 5 del Mes',
          value: topMembers.map((m, i) => {
            const username = m.house_members?.[0]?.username || 'Usuario';
            return `${i + 1}. **${username}** - ${m.points} pts`;
          }).join('\n'),
          inline: false
        });
      }

      embed.setFooter({ text: `Miembro desde ${new Date(userHouse.joinedAt).toLocaleDateString()}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en house info', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener información de la casa.'
      });
    }
  },
};
