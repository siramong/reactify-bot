const { Events, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const log = require('../utils/consoleLogger');

// Load button handlers
const buttonHandlers = new Map();
const buttonPath = path.join(__dirname, '../interactions/buttons');
if (fs.existsSync(buttonPath)) {
  const buttonFiles = fs.readdirSync(buttonPath).filter(file => file.endsWith('.js'));
  for (const file of buttonFiles) {
    const handler = require(path.join(buttonPath, file));
    if (handler.customId && handler.execute) {
      buttonHandlers.set(handler.customId, handler);
    }
  }
}

// Load modal handlers
const modalHandlers = new Map();
const modalPath = path.join(__dirname, '../interactions/modals');
if (fs.existsSync(modalPath)) {
  const modalFiles = fs.readdirSync(modalPath).filter(file => file.endsWith('.js'));
  for (const file of modalFiles) {
    const handler = require(path.join(modalPath, file));
    if (handler.customId && handler.execute) {
      modalHandlers.set(handler.customId, handler);
    }
  }
}

// Load select menu handlers
const selectMenuHandlers = new Map();
const selectMenuPath = path.join(__dirname, '../interactions/selectMenus');
if (fs.existsSync(selectMenuPath)) {
  const selectMenuFiles = fs.readdirSync(selectMenuPath).filter(file => file.endsWith('.js'));
  for (const file of selectMenuFiles) {
    const handler = require(path.join(selectMenuPath, file));
    if (handler.customId && handler.execute) {
      selectMenuHandlers.set(handler.customId, handler);
    }
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const commandName = interaction.commandName;
      const subcommand = interaction.options.getSubcommand(false);
      
      let command;
      if (subcommand) {
        command = interaction.client.commands.get(`${commandName}_${subcommand}`);
      } else {
        command = interaction.client.commands.get(`${commandName}_create`);
        if (!command) {
          command = interaction.client.commands.get(commandName);
        }
      }

      if (!command) {
        log.error('COMANDO', `No se encontró el comando: ${commandName}`);
        return;
      }

      const fullCommand = subcommand ? `${commandName} ${subcommand}` : commandName;
      log.command(fullCommand, interaction.user.tag, interaction.guild?.name || 'DM');

      try {
        await command.execute(interaction);
      } catch (error) {
        log.error('COMANDO', `Error ejecutando /${fullCommand}`, error);
        
        const errorMessage = '`❌` Hubo un error al ejecutar este comando.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
      }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
      const customId = interaction.customId;
      const baseId = customId.split('_')[0];
      
      const handler = buttonHandlers.get(baseId);
      
      if (!handler) {
        log.error('BOTÓN', `No se encontró el manejador para: ${customId}`);
        return;
      }

      log.interaction('BOTÓN', interaction.user.tag, customId);

      try {
        await handler.execute(interaction);
      } catch (error) {
        log.error('BOTÓN', `Error procesando botón: ${customId}`, error);
        
        const errorMessage = '`❌` Hubo un error al procesar esta acción.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
      }
    }
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      const customId = interaction.customId;
      const baseId = customId.split('_')[0];
      
      const handler = modalHandlers.get(baseId);
      
      if (!handler) {
        log.error('MODAL', `No se encontró el manejador para: ${customId}`);
        return;
      }

      log.interaction('MODAL', interaction.user.tag, customId);

      try {
        await handler.execute(interaction);
      } catch (error) {
        log.error('MODAL', `Error procesando formulario: ${customId}`, error);
        
        const errorMessage = '`❌` Hubo un error al procesar este formulario.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
      }
    }
    // Handle string select menu interactions
    else if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;
      
      const handler = selectMenuHandlers.get(customId);
      
      if (!handler) {
        log.error('SELECT MENU', `No se encontró el manejador para: ${customId}`);
        return;
      }

      log.interaction('SELECT MENU', interaction.user.tag, customId);

      try {
        await handler.execute(interaction);
      } catch (error) {
        log.error('SELECT MENU', `Error procesando selección: ${customId}`, error);
        
        const errorMessage = '`❌` Hubo un error al procesar esta selección.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
      }
    }
  },
};
