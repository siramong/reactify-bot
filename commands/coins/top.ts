import { SlashCommandSubcommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import supabaseService from '../../services/supabase';
import { formatTopUsersList, formatNumber } from '../../utils/formatting';
import { EMBEDS, ERRORS } from '../../config/strings';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('top')
    .setDescription('Ver el ranking de monedas'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();

      // Get top 10 users
      const topUsers = await supabaseService.getTopUsers(10);

      if (topUsers.length === 0) {
        await interaction.editReply('No hay usuarios en el ranking todavía.');
        return;
      }

      // Get current user's rank
      const userRank = await supabaseService.getUserRank(interaction.user.id);
      const user = await supabaseService.getUser(interaction.user.id);

      // Format top users list
      const description = formatTopUsersList(topUsers);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(EMBEDS.TOP_TITLE)
        .setDescription(description)
        .setColor(0x3498db); // Blue

      // Add footer if user is outside top 10
      if (userRank && userRank > 10) {
        embed.setFooter({
          text: `Tu posición: #${userRank} con ${formatNumber(user?.amount || 0)} monedas`
        });
      }

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in coins top command:', error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR
      });
    }
  },
};
