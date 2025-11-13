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

      // Get current balance
      const user = await supabaseService.getUser(targetUser.id);
      
      if (user.amount < amount) {
        const errorMsg = replacePlaceholders(strings.ERRORS.INSUFFICIENT_USER_COINS, {
          user: targetUser.username,
          current: user.amount,
          amount: amount
        });
        await interaction.editReply(errorMsg);
        return;
      }

      // Remove coins
      await supabaseService.removeCoins(targetUser.id, amount);

      // Log transaction
      const logger = getLogger();
      await logger.logTransaction({
        type: 'COINS_REMOVED',
        userId: targetUser.id,
        username: targetUser.username,
        amount: amount,
        reason: reason,
        performedBy: interaction.user.id,
        nivel: user?.nivel || 'No configurado'
      });

      log.transaction('REMOVER', amount, targetUser.tag);

      // Send response
      const response = replacePlaceholders(strings.SUCCESS.COINS_REMOVED, {
        amount: amount,
        user: targetUser.toString()
      });

      await interaction.editReply(response);

      // Try to DM the user
      try {
        const dmMessage = replacePlaceholders(strings.DM.COINS_DEDUCTED, {
          amount: amount,
          reason: reason
        });
        await targetUser.send(dmMessage);
      } catch (error) {
        log.warn('DM', 'No se pudo enviar DM al usuario');
      }
    } catch (error) {
      log.error('COMANDO', 'Error en coins remove', error);
      await interaction.editReply({
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};
