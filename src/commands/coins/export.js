const { SlashCommandSubcommandBuilder } = require('discord.js');
const { checkTeacherRole } = require('../../utils/permissions');
const supabaseService = require('../../services/supabase');
const n8nService = require('../../services/n8n');
const { replacePlaceholders } = require('../../utils/formatting');
const strings = require('../../config/strings');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('export')
    .setDescription('Exportar datos a n8n (solo docentes)'),
  
  async execute(interaction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member)) {
        await interaction.reply({
          content: strings.ERRORS.NO_PERMISSION,
          ephemeral: true
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      // Get all user data
      const allUsers = await supabaseService.getAllUsers();

      // Trigger n8n webhook and get the returned URL
      const result = await n8nService.exportToN8n({
        timestamp: new Date().toISOString(),
        totalUsers: allUsers.length,
        users: allUsers
      });

      // Extract URL from n8n response
      const exportUrl = result?.url || result?.fileUrl || 'URL no disponible';

      await interaction.editReply({
        content: `✅ Datos exportados exitosamente\n📎 **URL:** ${exportUrl}`
      });
    } catch (error) {
      console.error('Error in coins export command:', error);
      await interaction.editReply({
        content: strings.ERRORS.EXPORT_FAILED
      });
    }
  },
};
