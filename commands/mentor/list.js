const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('Ver mentores disponibles en tu casa'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get user's house
      const userHouse = await housesService.getUserHouse(interaction.user.id);
      
      if (!userHouse) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Sin Casa')
          .setDescription('Debes pertenecer a una casa para ver los mentores. Usa `/house join` primero.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      const house = userHouse.houses;

      // Get mentors
      const mentors = await housesService.getAvailableMentors(userHouse.houseId);

      const embed = new EmbedBuilder()
        .setTitle('👨‍🏫 Mentores Disponibles')
        .setDescription(`**${house.emoji || '🏠'} ${house.name}**\n\n${mentors.length === 0 ? 'Aún no hay mentores registrados en tu casa.' : ''}`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .setTimestamp();

      if (mentors.length > 0) {
        const certifiedMentors = mentors.filter(m => m.certified);
        const pendingMentors = mentors.filter(m => !m.certified);

        if (certifiedMentors.length > 0) {
          const certifiedList = certifiedMentors.map(mentor => {
            const username = mentor.house_members?.[0]?.username || 'Usuario';
            return `✅ **${username}** (${mentor.curso})\n   📅 ${mentor.availability}`;
          }).join('\n\n');

          embed.addFields({
            name: '🌟 Mentores Certificados',
            value: certifiedList,
            inline: false
          });
        }

        if (pendingMentors.length > 0) {
          const pendingList = pendingMentors.map(mentor => {
            const username = mentor.house_members?.[0]?.username || 'Usuario';
            return `⏳ **${username}** (${mentor.curso})\n   📅 ${mentor.availability}`;
          }).join('\n\n');

          embed.addFields({
            name: '⏳ Pendientes de Certificación',
            value: pendingList,
            inline: false
          });
        }
      }

      embed.setFooter({ text: 'Los mentores certificados pueden ayudarte con tus estudios' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en mentor list', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener la lista de mentores.'
      });
    }
  },
};
