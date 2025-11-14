const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const supabaseService = require('../../services/supabase');
const openrouterService = require('../../services/openrouter');
const config = require('../../config/config');
const { CURSOS } = require('../../config/enums');
const { replacePlaceholders } = require('../../utils/formatting');
const strings = require('../../config/strings');
const { getLogger } = require('../../utils/logger');
const log = require('../../utils/consoleLogger');

// Store pending activities that need curso selection
const pendingActivities = new Map();

module.exports = {
  customId: 'activitycreate',
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get form values
      const title = interaction.fields.getTextInputValue('title');
      const description = interaction.fields.getTextInputValue('description');
      const documentation = interaction.fields.getTextInputValue('documentation');
      const fieldsAttachment = (interaction.fields.getTextInputValue && (() => {
        try { return interaction.fields.getTextInputValue('attachment'); } catch (e) { return null; }
      })()) || null;

      const pendingAttachments = require('../../utils/pendingAttachments');
      const storedAttachment = pendingAttachments.getAndDelete(interaction.user.id);
      const attachment = fieldsAttachment || storedAttachment || null;
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

      const row = new ActionRowBuilder().addComponents(selectMenu);

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
      const filter = i => i.customId.startsWith('activitycurso_') && i.user.id === interaction.user.id;
      
      try {
        const selection = await interaction.channel.awaitMessageComponent({
          filter,
          time: 60000
        });

        await selection.deferUpdate();

        const curso = selection.values[0];
        
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
          content: strings.INFO.GENERATING_AI,
          components: []
        });

        // Generate AI summary (using FREE model)
        let aiSummary = '';
        try {
          aiSummary = await openrouterService.summarizeDocumentation(documentation);
        } catch (error) {
          log.error('OPENROUTER', 'Error generando resumen IA', error);
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

        const forumChannel = await interaction.client.channels.fetch(forumChannelId);

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
          .setTitle(replacePlaceholders(strings.EMBEDS.ACTIVITY_TITLE, { title }))
          .setDescription(description)
          .setColor(0x9b59b6) // Purple
          .addFields(
            {
              name: strings.FIELDS.DOCUMENTATION,
              value: documentation,
              inline: false
            },
            {
              name: strings.FIELDS.AI_SUMMARY,
              value: aiSummary,
              inline: false
            }
          );

        if (attachment) {
          embed.addFields({
            name: strings.FIELDS.IMAGE,
            value: attachment,
            inline: false
          });
        }

        if (reward > 0) {
          embed.addFields({
            name: strings.FIELDS.REWARD,
            value: `${reward} monedas`,
            inline: true
          });
        }

        embed.setTimestamp();

        // Send embed to thread
        const threadMessage = await thread.send({ embeds: [embed] });

        // Add reactions
        await threadMessage.react('👀');
        await threadMessage.react('✅');

        // Save to database with curso (exact course)
        await supabaseService.createActivity(title, interaction.user.id, curso, thread.id);

        // Log activity creation
        const logger = getLogger();
        await logger.logTransaction({
          type: 'ACTIVITY_CREATED',
          title: title,
          curso: curso,
          nivel: nivel,
          reward: reward,
          performedBy: interaction.user.id
        });

        log.info('ACTIVIDAD', `Creada: ${title} - Curso: ${curso} - Nivel: ${nivel}`);

        // Respond to teacher
        const response = replacePlaceholders(strings.SUCCESS.ACTIVITY_CREATED, {
          title: title,
          nivel: curso
        });

        await interaction.editReply({
          content: response
        });

        // Clean up
        pendingActivities.delete(activityId);
      } catch (error) {
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
      log.error('MODAL', 'Error en creación de actividad', error);
      await interaction.editReply({
        content: strings.ERRORS.DATABASE_ERROR,
        components: []
      });
    }
  },
};
