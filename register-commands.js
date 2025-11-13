const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('coins')
    .setDescription('Comandos de monedas')
    .addSubcommand(subcommand =>
      subcommand
        .setName('request')
        .setDescription('Solicitar monedas a los docentes'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('get')
        .setDescription('Ver tu balance de monedas'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('top')
        .setDescription('Ver el ranking de monedas'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Añadir monedas a un usuario (solo docentes)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Usuario al que añadir monedas')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Cantidad de monedas a añadir')
            .setRequired(true)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Razón de la adición')
            .setRequired(false)
            .setMaxLength(200)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remover monedas de un usuario (solo docentes)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Usuario del que remover monedas')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Cantidad de monedas a remover')
            .setRequired(true)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Razón de la deducción')
            .setRequired(false)
            .setMaxLength(200)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Resetear monedas (solo docentes)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Usuario específico (opcional)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('export')
        .setDescription('Exportar datos a n8n (solo docentes)'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('bid')
        .setDescription('Crear una subasta (solo docentes)')
        .addStringOption(option =>
          option.setName('item_name')
            .setDescription('Nombre del artículo')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('starting_bid')
            .setDescription('Puja inicial mínima')
            .setRequired(true)
            .setMinValue(10))
        .addIntegerOption(option =>
          option.setName('duration')
            .setDescription('Duración en minutos')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1440))),
  new SlashCommandBuilder()
    .setName('activity')
    .setDescription('Crear nueva actividad (solo docentes)')
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos slash...');

    // Check if APPLICATION_ID is set
    if (!process.env.APPLICATION_ID) {
      console.error('❌ ERROR: APPLICATION_ID no está configurado en .env');
      console.log('Por favor, añade APPLICATION_ID=tu_application_id a tu archivo .env');
      process.exit(1);
    }

    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { body: commands },
    );

    console.log('✅ Comandos registrados exitosamente');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
