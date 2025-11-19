const { SlashCommandSubcommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('award')
    .setDescription('Otorgar fragmentos y puntos a un usuario (admin/líder)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Usuario a quien otorgar')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('fragmentos')
        .setDescription('Cantidad de fragmentos a otorgar')
        .setRequired(true)
        .setMinValue(1))
    .addIntegerOption(option =>
      option.setName('points')
        .setDescription('Cantidad de puntos a otorgar')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Razón del otorgamiento')
        .setRequired(false)),
  
  async execute(interaction) {
    try {
      // Check permissions
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      
      // Check if user is a house leader
      const executorHouse = await housesService.getUserHouse(interaction.user.id);
      const isLeader = executorHouse?.role === 'leader';

      if (!isAdmin && !isLeader) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Sin Permisos')
          .setDescription('Solo los administradores y líderes de casa pueden otorgar recompensas.')
          .setColor(0xFF0000);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');
      const fragmentos = interaction.options.getInteger('fragmentos');
      const points = interaction.options.getInteger('points');
      const reason = interaction.options.getString('reason') || 'Sin razón especificada';

      // Get target user's house
      const targetUserHouse = await housesService.getUserHouse(targetUser.id);
      
      if (!targetUserHouse) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Usuario sin Casa')
          .setDescription(`${targetUser.username} no pertenece a ninguna casa.`)
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // If executor is a leader, can only award to their own house members
      if (isLeader && !isAdmin && executorHouse.houseId !== targetUserHouse.houseId) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Sin Permisos')
          .setDescription('Solo puedes otorgar recompensas a miembros de tu propia casa.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Award fragmentos
      await housesService.addFragmentos(targetUser.id, fragmentos, targetUserHouse.houseId);

      // Award points
      await housesService.addMonthlyPoints(targetUser.id, targetUserHouse.houseId, points);

      // Add to house history
      await housesService.addHouseHistory(
        targetUserHouse.houseId,
        'reward',
        `${targetUser.username} recibió ${fragmentos} fragmentos y ${points} puntos. Razón: ${reason}`
      );

      const house = targetUserHouse.houses;

      const embed = new EmbedBuilder()
        .setTitle('✅ Recompensa Otorgada')
        .setDescription(`Has otorgado recompensas a **${targetUser.username}**`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .addFields(
          {
            name: '👤 Usuario',
            value: targetUser.username,
            inline: true
          },
          {
            name: '🏠 Casa',
            value: `${house.emoji || '🏠'} ${house.name}`,
            inline: true
          },
          {
            name: '💎 Fragmentos',
            value: `**${fragmentos}** fragmentos`,
            inline: true
          },
          {
            name: '🏆 Puntos',
            value: `**${points}** puntos`,
            inline: true
          },
          {
            name: '📝 Razón',
            value: reason,
            inline: false
          }
        )
        .setFooter({ text: `Otorgado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      log.database('RECOMPENSA OTORGADA', `${fragmentos} fragmentos y ${points} puntos a ${targetUser.username}`);

    } catch (error) {
      log.error('COMANDO', 'Error en house award', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al otorgar la recompensa.'
      });
    }
  },
};
