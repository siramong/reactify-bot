const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('members')
    .setDescription('Ver los miembros de tu casa'),
  
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

      // Get house members
      const members = await housesService.getHouseMembers(house.id);

      // Group members by role
      const leaders = members.filter(m => m.role === 'leader');
      const organizers = members.filter(m => m.role === 'event_organizer');
      const regularMembers = members.filter(m => m.role === 'member');

      const embed = new EmbedBuilder()
        .setTitle(`👥 Miembros de ${house.name}`)
        .setDescription(`${house.emoji || '🏠'} **Total de miembros: ${members.length}**`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .setTimestamp();

      if (leaders.length > 0) {
        const leadersList = leaders.map(l => `• ${l.username}`).join('\n');
        embed.addFields({
          name: '👑 Líderes de la Casa',
          value: leadersList,
          inline: false
        });
      }

      if (organizers.length > 0) {
        const organizersList = organizers.map(o => `• ${o.username}`).join('\n');
        embed.addFields({
          name: '🎯 Organizadores de Eventos',
          value: organizersList,
          inline: false
        });
      }

      if (regularMembers.length > 0) {
        // Show only first 20 members to avoid hitting embed limits
        const membersToShow = regularMembers.slice(0, 20);
        const membersList = membersToShow.map(m => `• ${m.username}`).join('\n');
        const remaining = regularMembers.length - 20;
        
        embed.addFields({
          name: `⭐ Miembros (${regularMembers.length})`,
          value: membersList + (remaining > 0 ? `\n... y ${remaining} más` : ''),
          inline: false
        });
      }

      embed.setFooter({ text: `Casa creada el ${new Date(house.createdAt).toLocaleDateString('es-ES')}` });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en house members', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener los miembros de la casa.'
      });
    }
  },
};
