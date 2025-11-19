const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

const ACHIEVEMENT_TYPES = {
  'event_participation': { emoji: '🎯', name: 'Participación en Evento' },
  'mentor': { emoji: '👨‍🏫', name: 'Mentor Certificado' },
  'organizer': { emoji: '🎪', name: 'Organizador de Eventos' },
  'honor_seal': { emoji: '🏅', name: 'Sello de Honor' },
  'alliance': { emoji: '🤝', name: 'Alianza Formada' },
  'top_monthly': { emoji: '🌟', name: 'Top del Mes' },
  'first_place': { emoji: '🥇', name: 'Primer Lugar' },
  'event_win': { emoji: '🏆', name: 'Victoria en Evento' },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('Ver tus logros y badges obtenidos'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get user's achievements
      const achievements = await housesService.getUserAchievements(interaction.user.id);

      // Get user's house
      const userHouse = await housesService.getUserHouse(interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('🏅 Tus Logros y Badges')
        .setDescription(achievements.length === 0 ? 
          'Aún no has desbloqueado ningún logro. ¡Participa en eventos y actividades para obtenerlos!' :
          `Has desbloqueado **${achievements.length}** logros.`)
        .setColor(0xFFD700)
        .setTimestamp();

      if (userHouse) {
        embed.setAuthor({ 
          name: `${userHouse.houses.emoji || '🏠'} ${userHouse.houses.name}` 
        });
      }

      if (achievements.length > 0) {
        // Group achievements by type
        const groupedAchievements = {};
        achievements.forEach(achievement => {
          if (!groupedAchievements[achievement.achievementType]) {
            groupedAchievements[achievement.achievementType] = [];
          }
          groupedAchievements[achievement.achievementType].push(achievement);
        });

        // Add fields for each achievement type
        Object.entries(groupedAchievements).forEach(([type, achvs]) => {
          const typeInfo = ACHIEVEMENT_TYPES[type] || { emoji: '🎖️', name: type };
          const count = achvs.length;
          const dates = achvs.map(a => new Date(a.awardedAt).toLocaleDateString('es-ES')).join(', ');
          
          embed.addFields({
            name: `${typeInfo.emoji} ${typeInfo.name}`,
            value: count > 1 ? 
              `**${count}** veces\nÚltima vez: ${new Date(achvs[0].awardedAt).toLocaleDateString('es-ES')}` :
              `Obtenido: ${dates}`,
            inline: true
          });
        });
      }

      embed.setFooter({ text: 'Sigue participando para desbloquear más logros' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en achievements', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener tus logros.'
      });
    }
  },
};
