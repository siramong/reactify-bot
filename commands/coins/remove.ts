import { SlashCommandSubcommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { ensureUserExists } from '../../utils/userManager';
import { checkTeacherRole } from '../../utils/permissions';
import supabaseService from '../../services/supabase';
import { replacePlaceholders } from '../../utils/formatting';
import { SUCCESS, ERRORS, DM, PLACEHOLDERS } from '../../config/strings';
import { getLogger } from '../../utils/logger';
import consoleLogger from '../../utils/consoleLogger';

export default {
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
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member as any)) {
        await interaction.reply({
          content: ERRORS.NO_PERMISSION,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.get('amount', true).value as number;
      const reason = interaction.options.get('reason')?.value as string || PLACEHOLDERS.NOT_SPECIFIED;

      // Ensure target user exists
      await ensureUserExists(targetUser.id, targetUser.username);

      // Get current balance
      const user = await supabaseService.getUser(targetUser.id);
      
      if (user && user.amount < amount) {
        const errorMsg = replacePlaceholders(ERRORS.INSUFFICIENT_USER_COINS, {
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
        nivel: user?.curso || 'No configurado'
      });

      consoleLogger.transaction('REMOVER', amount, targetUser.tag);

      // Send response
      const response = replacePlaceholders(SUCCESS.COINS_REMOVED, {
        amount: amount,
        user: targetUser.toString()
      });

      await interaction.editReply(response);

      // Try to DM the user
      try {
        const dmMessage = replacePlaceholders(DM.COINS_DEDUCTED, {
          amount: amount,
          reason: reason
        });
        await targetUser.send(dmMessage);
      } catch (error) {
        consoleLogger.warn('DM', 'No se pudo enviar DM al usuario');
      }
    } catch (error) {
      consoleLogger.error('COMANDO', 'Error en coins remove', error as Error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR
      });
    }
  },
};
