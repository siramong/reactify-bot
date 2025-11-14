import { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags, ModalSubmitInteraction, ForumChannel, Message } from 'discord.js';
import supabaseService from '../../services/supabase';
import openrouterService from '../../services/openrouter';
import config from '../../config/config';
import { CURSOS, Curso } from '../../config/enums';
import { replacePlaceholders } from '../../utils/formatting';
import { EMBEDS, FIELDS, SUCCESS, ERRORS, INFO } from '../../config/strings';
import { getLogger } from '../../utils/logger';
import consoleLogger from '../../utils/consoleLogger';
import * as pendingAttachments from '../../utils/pendingAttachments';

interface PendingActivity {
  title: string;
  description: string;
  documentation: string;
  attachment: string | null;
  reward: number;
  teacherId: string;
}

// Store pending activities that need curso selection
const pendingActivities = new Map<string, PendingActivity>();

export default {
  customId: 'activitycreate',
  async execute(interaction: ModalSubmitInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get form values
      const title = interaction.fields.getTextInputValue('title');
      const description = interaction.fields.getTextInputValue('description');
      const documentation = interaction.fields.getTextInputValue('documentation');
      let fieldsAttachment: string | null = null;
      try {
        fieldsAttachment = interaction.fields.getTextInputValue('attachment');
      } catch (e) {
        fieldsAttachment = null;
      }

      const storedAttachment = pendingAttachments.getAndDelete(interaction.user.id);
      const attachment = fieldsAttachment || (storedAttachment ? String(storedAttachment) : null);
      const rewardStr = interaction.fields.getTextInputValue('reward') || '0';

      // Parse reward
      const reward = parseInt(rewardStr) || 0;

      // Show curso selection menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`activitycurso_${interaction.user.id}_${Date.now()}`)
        .setPlaceholder('Selecciona el curso exacto')
        .addOptions(
          CURSOS.map(curso => ({
            label: curso,
            value: curso
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      // Store activity data
      const activityId = `${interaction.user.id}_${Date.now()}`;
      pendingActivities.set(activityId, {
        title,
        description,
        documentation,
        attachment,
        reward,
        teacherId: interaction.user.id
      });

      await interaction.editReply({
        content: '📚 Selecciona el curso para esta actividad:',
        components: [row]
      });

      // Wait for selection
      const filter = (i: any) => i.customId.startsWith('activitycurso_') && i.user.id === interaction.user.id;
      
      try {
        const selection = await interaction.channel!.awaitMessageComponent({
          filter,
          time: 60000
        });

        await selection.deferUpdate();

        const curso = (selection as any).values[0] as Curso;
        
        // Get nivel from curso
        const nivel = config.CURSO_TO_NIVEL[curso];
        if (!nivel) {
          await interaction.editReply({
            content: `❌ No se pudo determinar el nivel para el curso ${curso}`,
            components: []
          });
          return;
        }

        // Update initial message
        await interaction.editReply({
          content: INFO.GENERATING_AI,
          components: []
        });

        // Generate AI summary (using FREE model)
        let aiSummary = '';
        try {
          aiSummary = await openrouterService.summarizeDocumentation(documentation);
        } catch (error) {
          consoleLogger.error('OPENROUTER', 'Error generando resumen IA', error as Error);
          aiSummary = 'No se pudo generar resumen automático.';
        }

        // Get forum channel for nivel
        const forumChannelId = config.FORUM_CHANNELS[nivel];
        if (!forumChannelId) {
          await interaction.editReply({
            content: `❌ No se encontró el canal del foro para ${nivel}`,
            components: []
          });
          return;
        }

        const forumChannel = await interaction.client.channels.fetch(forumChannelId) as ForumChannel;

        // Create thread in forum with format "Curso | Activity Title"
        const threadName = `${curso} | ${title}`;
        const thread = await forumChannel.threads.create({
          name: threadName,
          message: {
            content: `Nueva actividad creada por <@${interaction.user.id}>`
          }
        });

        // Create activity embed
        const embed = new EmbedBuilder()
          .setTitle(replacePlaceholders(EMBEDS.ACTIVITY_TITLE, { title }))
          .setDescription(description)
          .setColor(0x9b59b6) // Purple
          .addFields(
            {
              name: FIELDS.DOCUMENTATION,
              value: documentation,
              inline: false
            },
            {
              name: FIELDS.AI_SUMMARY,
              value: aiSummary,
              inline: false
            }
          );

        if (attachment) {
          embed.addFields({
            name: FIELDS.IMAGE,
            value: attachment,
            inline: false
          });
        }

        if (reward > 0) {
          embed.addFields({
            name: FIELDS.REWARD,
            value: `${reward} monedas`,
            inline: true
          });
        }

        embed.setTimestamp();

        // Send embed to thread
        const threadMessage = await thread.send({ embeds: [embed] }) as Message;

        // Add reactions
        await threadMessage.react('👀');
        await threadMessage.react('✅');

        // Save to database with curso (exact course)
        await supabaseService.createActivity(title, interaction.user.id, curso, thread.id);

        // Log activity creation
        const logger = getLogger();
        await logger.logTransaction({
          type: 'ACTIVITY_CREATED',
          userId: interaction.user.id,
          title: title,
          nivel: curso,
          reward: reward,
          performedBy: interaction.user.id
        });

        consoleLogger.info('ACTIVIDAD', `Creada: ${title} - Curso: ${curso} - Nivel: ${nivel}`);

        // Respond to teacher
        const response = replacePlaceholders(SUCCESS.ACTIVITY_CREATED, {
          title: title,
          nivel: curso
        });

        await interaction.editReply({
          content: response
        });

        // Clean up
        pendingActivities.delete(activityId);
      } catch (error: any) {
        if (error.message === 'Collector received no interactions before ending with reason: time') {
          await interaction.editReply({
            content: '❌ Tiempo de espera agotado. Por favor, intenta de nuevo.',
            components: []
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      consoleLogger.error('MODAL', 'Error en creación de actividad', error as Error);
      await interaction.editReply({
        content: ERRORS.DATABASE_ERROR,
        components: []
      });
    }
  },
};
