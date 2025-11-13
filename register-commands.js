const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Automatically build commands from files in ./commands
const commands = [];
const commandsDir = path.join(__dirname, 'commands');

if (fs.existsSync(commandsDir)) {
  const entries = fs.readdirSync(commandsDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(commandsDir, entry.name);

    if (entry.isDirectory()) {
      // Collect subcommands or full command files inside the folder
      const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.js'));
      const subcommandOptions = [];
      let pushedTopLevel = false;

      for (const file of files) {
        const mod = require(path.join(entryPath, file));
        if (!mod || !mod.data) continue;

        const ctor = mod.data.constructor && mod.data.constructor.name;

        if (ctor === 'SlashCommandBuilder') {
          // Top-level command (e.g., activity)
          commands.push(mod.data.toJSON());
          pushedTopLevel = true;
        } else if (ctor === 'SlashCommandSubcommandBuilder') {
          subcommandOptions.push(mod.data.toJSON());
        } else {
          // Fallback: try toJSON
          try {
            const json = mod.data.toJSON();
            if (json.type === 1) subcommandOptions.push(json);
            else commands.push(json);
          } catch (err) {
            // ignore unknown exports
          }
        }
      }

      if (subcommandOptions.length > 0 && !pushedTopLevel) {
        const parent = new SlashCommandBuilder()
          .setName(entry.name)
          .setDescription(`Comandos de ${entry.name}`);

        const parentJson = parent.toJSON();
        parentJson.options = subcommandOptions;
        commands.push(parentJson);
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      // Command file at root of commands/ (rare)
      const mod = require(entryPath);
      if (mod && mod.data) {
        try {
          commands.push(mod.data.toJSON());
        } catch (err) {
          // ignore
        }
      }
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos slash...');

    // If SKIP_REGISTRATION is set we only print the built commands and exit.
    if (process.env.SKIP_REGISTRATION === '1') {
      console.log('SKIP_REGISTRATION=1 -> comandos construidos:');
      console.log(JSON.stringify(commands, null, 2));
      return;
    }

    // Check if APPLICATION_ID is set
    if (!process.env.APPLICATION_ID) {
      console.error('❌ ERROR: APPLICATION_ID no está configurado en .env');
      console.log('Por favor, añade APPLICATION_ID=tu_application_id a tu archivo .env');
      process.exit(1);
    }

    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { body: commands },
    );

    console.log('✅ Comandos registrados exitosamente');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
