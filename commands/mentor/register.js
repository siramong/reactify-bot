const { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const housesService = require('../../services/houses');
const supabaseService = require('../../services/supabase');
const { ensureUserExists } = require('../../utils/userManager');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('register')
    .setDescription('Registrarte como mentor (solo 2do y 3ro de Bachillerato)')
    .addStringOption(option =>
      option.setName('availability')
        .setDescription('Describe tu disponibilidad horaria')
        .setRequired(true)),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Ensure user exists
      await ensureUserExists(interaction.user.id, interaction.user.username);

      // Get user's curso from coins table
      const user = await supabaseService.getUser(interaction.user.id);
      
      if (!user || !user.curso) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Curso No Configurado')
          .setDescription('Tu curso no está configurado. Contacta a un administrador para que configure tu curso en el sistema.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Check if user is in 2nd or 3rd year
      if (!['2E1', '2E2', '3E1', '3E2'].includes(user.curso)) {
        const embed = new EmbedBuilder()
          .setTitle('❌ No Elegible')
          .setDescription('Solo estudiantes de **Segundo** y **Tercero de Bachillerato** pueden registrarse como mentores.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get user's house
      const userHouse = await housesService.getUserHouse(interaction.user.id);
      
      if (!userHouse) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Sin Casa')
          .setDescription('Debes pertenecer a una casa para registrarte como mentor. Usa `/house join` primero.')
          .setColor(0xFF0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }

      const availability = interaction.options.getString('availability');

      // Register as mentor
      await housesService.registerMentor(interaction.user.id, userHouse.houseId, availability, user.curso);

      // Add to house history
      await housesService.addHouseHistory(
        userHouse.houseId,
        'mentor_registered',
        `${interaction.user.username} se registró como mentor`
      );

      const house = userHouse.houses;

      const embed = new EmbedBuilder()
        .setTitle('✅ Registro como Mentor Exitoso')
        .setDescription(`Te has registrado como mentor en **${house.emoji || '🏠'} ${house.name}**`)
        .setColor(parseInt(house.color.replace('#', ''), 16) || 0x00AE86)
        .addFields(
          {
            name: '👨‍🏫 Estado',
            value: '**Pendiente de Certificación**',
            inline: true
          },
          {
            name: '📚 Curso',
            value: `**${user.curso}**`,
            inline: true
          },
          {
            name: '🕐 Disponibilidad',
            value: availability,
            inline: false
          }
        )
        .addFields({
          name: '📝 Próximos Pasos',
          value: '• Espera a que el líder de tu casa certifique tu registro\n• Comienza a ofrecer mentoría a estudiantes de cursos inferiores\n• Las sesiones certificadas te darán puntos y fragmentos',
          inline: false
        })
        .setFooter({ text: 'El líder de tu casa debe certificarte para activar tu rol de mentor' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      log.database('MENTOR REGISTRADO', `${interaction.user.username} - Curso: ${user.curso}`);

    } catch (error) {
      log.error('COMANDO', 'Error en mentor register', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al registrarte como mentor.'
      });
    }
  },
};
