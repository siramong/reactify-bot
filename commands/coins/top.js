const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const supabaseService = require('../../services/supabase');
const { formatTopUsersList, formatNumber } = require('../../utils/formatting');
const strings = require('../../config/strings');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('top')
    .setDescription('Ver el ranking de monedas'),
  
  async execute(interaction) {
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
        .setTitle(strings.EMBEDS.TOP_TITLE)
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
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};
