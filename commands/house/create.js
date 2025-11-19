const { SlashCommandSubcommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Crear una nueva casa (solo administradores)')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Nombre de la casa')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Descripción de la casa')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Color en formato hexadecimal (ej: #FF5733)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji que representa la casa')
        .setRequired(true)),
  
  async execute(interaction) {
    try {
      // Check if user has administrator permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Sin Permisos')
          .setDescription('Solo los administradores pueden crear casas.')
          .setColor(0xFF0000);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const color = interaction.options.getString('color');
      const emoji = interaction.options.getString('emoji');

      // Validate color format
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Color Inválido')
          .setDescription('El color debe estar en formato hexadecimal (ej: #FF5733)')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Create house
      const house = await housesService.createHouse(name, description, color, emoji);

      const embed = new EmbedBuilder()
        .setTitle('✅ Casa Creada')
        .setDescription(`La casa **${emoji} ${name}** ha sido creada exitosamente.`)
        .setColor(parseInt(color.replace('#', ''), 16))
        .addFields(
          {
            name: '📝 Descripción',
            value: description,
            inline: false
          },
          {
            name: '🎨 Color',
            value: color,
            inline: true
          },
          {
            name: '🆔 ID',
            value: house.id,
            inline: true
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      log.database('CASA CREADA', `${name} por ${interaction.user.username}`);

    } catch (error) {
      log.error('COMANDO', 'Error en house create', error);
      
      if (error.message?.includes('duplicate') || error.code === '23505') {
        await interaction.editReply({
          content: '❌ Ya existe una casa con ese nombre.'
        });
      } else {
        await interaction.editReply({
          content: '❌ Ocurrió un error al crear la casa.'
        });
      }
    }
  },
};
