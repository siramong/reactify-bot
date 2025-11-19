const { SlashCommandSubcommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const housesService = require('../../services/houses');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('assign')
    .setDescription('Asignar un rol a un miembro de la casa (admin/líder)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Usuario al que asignar el rol')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('role')
        .setDescription('Rol a asignar')
        .setRequired(true)
        .addChoices(
          { name: 'Miembro', value: 'member' },
          { name: 'Organizador de Eventos', value: 'event_organizer' },
          { name: 'Líder de la Casa', value: 'leader' }
        )),
  
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
          .setDescription('Solo los administradores y líderes de casa pueden asignar roles.')
          .setColor(0xFF0000);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('user');
      const newRole = interaction.options.getString('role');

      // Get target user's house
      const targetUserHouse = await housesService.getUserHouse(targetUser.id);
      
      if (!targetUserHouse) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Usuario sin Casa')
          .setDescription(`${targetUser.username} no pertenece a ninguna casa.`)
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // If executor is a leader (not admin), can only assign roles in their own house
      if (isLeader && !isAdmin && executorHouse.houseId !== targetUserHouse.houseId) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Sin Permisos')
          .setDescription('Solo puedes asignar roles a miembros de tu propia casa.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Update member role
      await housesService.updateMemberRole(targetUser.id, targetUserHouse.houseId, newRole);

      // Add to house history
      const roleNames = {
        'member': 'Miembro',
        'event_organizer': 'Organizador de Eventos',
        'leader': 'Líder de la Casa'
      };
      
      await housesService.addHouseHistory(
        targetUserHouse.houseId,
        'role_assigned',
        `${targetUser.username} fue asignado como ${roleNames[newRole]}`
      );

      const house = targetUserHouse.houses;

      const embed = new EmbedBuilder()
        .setTitle('✅ Rol Asignado')
        .setDescription(`Has asignado un nuevo rol a **${targetUser.username}**`)
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
            name: '⭐ Nuevo Rol',
            value: `**${roleNames[newRole]}**`,
            inline: true
          }
        )
        .setFooter({ text: `Asignado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      log.database('ROL ASIGNADO', `${targetUser.username} -> ${roleNames[newRole]}`);

    } catch (error) {
      log.error('COMANDO', 'Error en house assign', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al asignar el rol.'
      });
    }
  },
};
