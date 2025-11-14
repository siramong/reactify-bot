import { SlashCommandSubcommandBuilder, CommandInteraction } from 'discord.js';
import { checkTeacherRole } from '../../utils/permissions';
import supabaseService from '../../services/supabase';
import n8nService from '../../services/n8n';
import { ERRORS } from '../../config/strings';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('export')
    .setDescription('Exportar datos a n8n (solo docentes)'),
  
  async execute(interaction: CommandInteraction) {
    try {
      // Check teacher permission
      if (!checkTeacherRole(interaction.member as any)) {
        await interaction.reply({
          content: ERRORS.NO_PERMISSION,
          flags: 64 // Ephemeral
        });
        return;
      }

      await interaction.deferReply({ flags: 64 }); // Ephemeral

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
        content: ERRORS.EXPORT_FAILED
      });
    }
  },
};
