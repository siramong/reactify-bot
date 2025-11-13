const { SlashCommandSubcommandBuilder, MessageFlags } = require('discord.js');
const { ensureUserExists } = require('../../utils/userManager');
const { checkTeacherRole } = require('../../utils/permissions');
const supabaseService = require('../../services/supabase');
const { replacePlaceholders } = require('../../utils/formatting');
const strings = require('../../config/strings');
const { getLogger } = require('../../utils/logger');
const log = require('../../utils/consoleLogger');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
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
        .setMaxLength(200)),
  
  async execute(interaction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member)) {
        await interaction.reply({
          content: strings.ERRORS.NO_PERMISSION,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const reason = interaction.options.getString('reason') || strings.PLACEHOLDERS.NOT_SPECIFIED;

      // Ensure target user exists
      await ensureUserExists(targetUser.id, targetUser.username);

      // Add coins
      await supabaseService.addCoins(targetUser.id, amount);

      // Get user data for curso (displayed as nivel)
      const userData = await supabaseService.getUser(targetUser.id);

      // Log transaction
      const logger = getLogger();
      await logger.logTransaction({
        type: 'COINS_ADDED',
        userId: targetUser.id,
        username: targetUser.username,
        amount: amount,
        reason: reason,
        performedBy: interaction.user.id,
        nivel: userData?.curso || 'No configurado'
      });

      log.transaction('AÑADIR', amount, targetUser.tag);

      // Send response
      const response = replacePlaceholders(strings.SUCCESS.COINS_ADDED, {
        amount: amount,
        user: targetUser.toString()
      });

      await interaction.editReply(response);

      // Try to DM the recipient
      try {
        const dmMessage = replacePlaceholders(strings.DM.COINS_RECEIVED, {
          amount: amount,
          reason: reason
        });
        await targetUser.send(dmMessage);
      } catch (error) {
        log.warn('DM', 'No se pudo enviar DM al usuario');
      }
    } catch (error) {
      log.error('COMANDO', 'Error en coins add', error);
      await interaction.editReply({
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};
