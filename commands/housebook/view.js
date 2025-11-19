const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

const EVENT_TYPE_NAMES = {
  'new_member': '🎉 Nuevo Miembro',
  'reward': '🎁 Recompensa',
  'role_assigned': '👤 Rol Asignado',
  'mentor_registered': '👨‍🏫 Mentor Registrado',
  'alliance': '🤝 Alianza',
  'event_win': '🏆 Victoria',
  'achievement': '🏅 Logro',
  'event': '🎯 Evento'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('housebook')
    .setDescription('Ver el libro de historia de tu casa'),
  
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

      // Get house history (last 15 entries)
      const history = await housesService.getHouseHistory(house.id, 15);

      const embed = new EmbedBuilder()
        .setTitle(`📖 Libro de ${house.name}`)
        .setDescription(`${house.emoji || '🏠'} Historia y logros de la casa\n\n${history.length === 0 ? 'La historia de tu casa comienza ahora...' : ''}`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .setTimestamp();

      if (history.length > 0) {
        const historyText = history.map(entry => {
          const eventTypeName = EVENT_TYPE_NAMES[entry.eventType] || `📌 ${entry.eventType}`;
          const date = new Date(entry.date).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
          return `**${date}** - ${eventTypeName}\n${entry.description}`;
        }).join('\n\n');

        embed.addFields({
          name: '📜 Últimos Eventos',
          value: historyText.length > 1024 ? historyText.substring(0, 1020) + '...' : historyText,
          inline: false
        });
      }

      embed.setFooter({ text: 'Los eventos más recientes aparecen primero' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      log.error('COMANDO', 'Error en housebook', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al obtener el libro de la casa.'
      });
    }
  },
};
