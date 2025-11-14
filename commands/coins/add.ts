import { SlashCommandSubcommandBuilder, MessageFlags, CommandInteraction } from 'discord.js';
import { ensureUserExists } from '../../utils/userManager';
import { checkTeacherRole } from '../../utils/permissions';
import supabaseService from '../../services/supabase';
import { replacePlaceholders } from '../../utils/formatting';
import { SUCCESS, ERRORS, DM, PLACEHOLDERS } from '../../config/strings';
import { getLogger } from '../../utils/logger';
import consoleLogger from '../../utils/consoleLogger';

export default {
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
  
  async execute(interaction: CommandInteraction) {
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

      consoleLogger.transaction('AÑADIR', amount, targetUser.tag);

      // Send response
      const response = replacePlaceholders(SUCCESS.COINS_ADDED, {
        amount: amount,
        user: targetUser.toString()
      });

      await interaction.editReply(response);

      // Try to DM the recipient
      try {
        const dmMessage = replacePlaceholders(DM.COINS_RECEIVED, {
          amount: amount,
          reason: reason
        });
        await targetUser.send(dmMessage);
      } catch (error) {
        consoleLogger.warn('DM', 'No se pudo enviar DM al usuario');
      }
    } catch (error) {
      consoleLogger.error('COMANDO', 'Error en coins add', error as Error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR
      });
    }
  },
};
