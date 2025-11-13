const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { ensureUserExists } = require('../../utils/userManager');
const supabaseService = require('../../services/supabase');
const { formatCoins } = require('../../utils/formatting');
const strings = require('../../config/strings');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('get')
    .setDescription('Ver tu balance de monedas'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Ensure user exists
      const user = await ensureUserExists(interaction.user.id, interaction.user.username);

      // Get user rank
      const rank = await supabaseService.getUserRank(interaction.user.id);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(strings.EMBEDS.BALANCE_TITLE)
        .setColor(0xFFD700) // Gold
        .addFields(
          {
            name: strings.FIELDS.CURRENT_BALANCE,
            value: formatCoins(user.amount),
            inline: true
          },
          {
            name: strings.FIELDS.RANK,
            value: `**#${rank}**`,
            inline: true
          },
          {
            name: strings.FIELDS.CURSO,
            value: user.curso ? `**${user.curso}**` : '*No configurado*',
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({ text: `Usuario: ${interaction.user.username}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in coins get command:', error);
      await interaction.editReply({
        content: strings.ERRORS.DATABASE_ERROR
      });
    }
  },
};
