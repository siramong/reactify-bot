import { Events, MessageFlags, Interaction, CommandInteraction, ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import consoleLogger from '../utils/consoleLogger';

interface CommandHandler {
  execute: (interaction: CommandInteraction) => Promise<void>;
}

interface ButtonHandler {
  customId: string;
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

interface ModalHandler {
  customId: string;
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

// Load button handlers
const buttonHandlers = new Map<string, ButtonHandler>();
const buttonPath = path.join(__dirname, '../interactions/buttons');
if (fs.existsSync(buttonPath)) {
  const buttonFiles = fs.readdirSync(buttonPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
  for (const file of buttonFiles) {
    const handler = require(path.join(buttonPath, file));
    const handlerData = handler.default || handler;
    if (handlerData.customId && handlerData.execute) {
      buttonHandlers.set(handlerData.customId, handlerData);
    }
  }
}

// Load modal handlers
const modalHandlers = new Map<string, ModalHandler>();
const modalPath = path.join(__dirname, '../interactions/modals');
if (fs.existsSync(modalPath)) {
  const modalFiles = fs.readdirSync(modalPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
  for (const file of modalFiles) {
    const handler = require(path.join(modalPath, file));
    const handlerData = handler.default || handler;
    if (handlerData.customId && handlerData.execute) {
      modalHandlers.set(handlerData.customId, handlerData);
    }
  }
}

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const commandName = interaction.commandName;
      const subcommand = interaction.options.getSubcommand(false);
      
      let command: CommandHandler | undefined;
      if (subcommand) {
        command = (interaction.client as any).commands.get(`${commandName}_${subcommand}`);
      } else {
        command = (interaction.client as any).commands.get(`${commandName}_create`);
        if (!command) {
          command = (interaction.client as any).commands.get(commandName);
        }
      }

      if (!command) {
        consoleLogger.error('COMANDO', `No se encontró el comando: ${commandName}`);
        return;
      }

      const fullCommand = subcommand ? `${commandName} ${subcommand}` : commandName;
      consoleLogger.command(fullCommand, interaction.user.tag, interaction.guild?.name || 'DM');

      try {
        await command.execute(interaction);
      } catch (error) {
        consoleLogger.error('COMANDO', `Error ejecutando /${fullCommand}`, error as Error);
        
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
        consoleLogger.error('BOTÓN', `No se encontró el manejador para: ${customId}`);
        return;
      }

      consoleLogger.interaction('BOTÓN', interaction.user.tag, customId);

      try {
        await handler.execute(interaction);
      } catch (error) {
        consoleLogger.error('BOTÓN', `Error procesando botón: ${customId}`, error as Error);
        
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
        consoleLogger.error('MODAL', `No se encontró el manejador para: ${customId}`);
        return;
      }

      consoleLogger.interaction('MODAL', interaction.user.tag, customId);

      try {
        await handler.execute(interaction);
      } catch (error) {
        consoleLogger.error('MODAL', `Error procesando formulario: ${customId}`, error as Error);
        
        const errorMessage = '`❌` Hubo un error al procesar este formulario.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
      }
    }
  },
};
