import { SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags, CommandInteraction } from 'discord.js';
import { ensureUserExists } from '../../utils/userManager';
import supabaseService from '../../services/supabase';
import { formatCoins } from '../../utils/formatting';
import { EMBEDS, FIELDS, ERRORS } from '../../config/strings';
import consoleLogger from '../../utils/consoleLogger';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('get')
    .setDescription('Ver tu balance de monedas'),
  
  async execute(interaction: CommandInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Ensure user exists
      const user = await ensureUserExists(interaction.user.id, interaction.user.username);

      // Get user rank
      const rank = await supabaseService.getUserRank(interaction.user.id);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(EMBEDS.BALANCE_TITLE)
        .setColor(0xFFD700) // Gold
        .addFields(
          {
            name: FIELDS.CURRENT_BALANCE,
            value: formatCoins(user.amount),
            inline: true
          },
          {
            name: FIELDS.RANK,
            value: `**#${rank}**`,
            inline: true
          },
          {
            name: FIELDS.NIVEL,
            value: user.curso ? `**${user.curso}**` : '*No configurado*',
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({ text: `Usuario: ${interaction.user.username}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      consoleLogger.error('COMANDO', 'Error en coins get', error as Error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR
      });
    }
  },
};
