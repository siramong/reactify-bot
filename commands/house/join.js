const { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('join')
    .setDescription('Únete a una casa'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Check if user is already in a house
      const currentHouse = await housesService.getUserHouse(interaction.user.id);
      if (currentHouse) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Ya perteneces a una casa')
          .setDescription(`Ya eres miembro de **${currentHouse.houses.name}** ${currentHouse.houses.emoji}`)
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get all available houses
      const houses = await housesService.getAllHouses();
      
      if (!houses || houses.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('❌ No hay casas disponibles')
          .setDescription('Las casas aún no han sido creadas. Contacta a un administrador.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Create select menu with houses
      const options = houses.map(house => ({
        label: house.name,
        value: house.id,
        description: house.description ? house.description.substring(0, 100) : 'Casa sin descripción',
        emoji: house.emoji || '🏠'
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('house_select_join')
        .setPlaceholder('Selecciona una casa para unirte')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setTitle('🏠 Selecciona tu Casa')
        .setDescription('Elige la casa a la que deseas unirte. Esta decisión es importante ya que representarás a tu casa en eventos y competencias.\n\n**Casas disponibles:**')
        .setColor(0x00AE86)
        .setFooter({ text: 'Selecciona una casa del menú desplegable' });

      // Add field for each house
      houses.forEach(house => {
        embed.addFields({
          name: `${house.emoji || '🏠'} ${house.name}`,
          value: house.description || 'Sin descripción',
          inline: false
        });
      });

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      log.error('COMANDO', 'Error en house join', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al intentar unirte a una casa. Inténtalo de nuevo más tarde.'
      });
    }
  },
};
