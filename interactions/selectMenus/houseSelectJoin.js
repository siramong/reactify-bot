const { EmbedBuilder } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  customId: 'house_select_join',
  
  async execute(interaction) {
    try {
      await interaction.deferUpdate();

      const houseId = interaction.values[0];
      const userId = interaction.user.id;
      const username = interaction.user.username;

      // Check if user is already in a house (double check)
      const currentHouse = await housesService.getUserHouse(userId);
      if (currentHouse) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Ya perteneces a una casa')
          .setDescription(`Ya eres miembro de **${currentHouse.houses.name}** ${currentHouse.houses.emoji}`)
          .setColor(0xFF0000);
        
        return await interaction.editReply({ 
          embeds: [embed],
          components: [] 
        });
      }

      // Get selected house
      const house = await housesService.getHouseById(houseId);
      if (!house) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Casa no encontrada')
          .setDescription('La casa seleccionada no existe.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ 
          embeds: [embed],
          components: [] 
        });
      }

      // Join house
      await housesService.joinHouse(userId, username, houseId);

      // Initialize fragmentos
      await housesService.updateFragmentos(userId, 0, houseId);

      // Add to house history
      await housesService.addHouseHistory(
        houseId,
        'new_member',
        `${username} se unió a la casa`
      );

      const embed = new EmbedBuilder()
        .setTitle('✅ ¡Bienvenido a tu Casa!')
        .setDescription(`Te has unido exitosamente a **${house.emoji || '🏠'} ${house.name}**`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .addFields(
          {
            name: '🏠 Casa',
            value: `${house.emoji || '🏠'} **${house.name}**`,
            inline: true
          },
          {
            name: '👤 Tu Rol',
            value: '**Miembro**',
            inline: true
          },
          {
            name: '💎 Fragmentos Iniciales',
            value: '**0** fragmentos',
            inline: true
          }
        )
        .addFields({
          name: '📝 Sobre tu Casa',
          value: house.description || 'Sin descripción',
          inline: false
        })
        .addFields({
          name: '🎯 Próximos Pasos',
          value: '• Participa en eventos de tu casa\n• Gana puntos y fragmentos\n• Sube en el ranking mensual\n• Colabora con tus compañeros',
          inline: false
        })
        .setFooter({ text: '¡Buena suerte en tu nueva casa!' })
        .setTimestamp();

      await interaction.editReply({ 
        embeds: [embed],
        components: [] 
      });

      log.database('UNIRSE A CASA', `${username} -> ${house.name}`);

    } catch (error) {
      log.error('INTERACCIÓN', 'Error en house_select_join', error);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Ocurrió un error al unirte a la casa. Inténtalo de nuevo.')
        .setColor(0xFF0000);
      
      await interaction.editReply({ 
        embeds: [embed],
        components: [] 
      });
    }
  },
};
