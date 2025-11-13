# Reactify Bot

Bot de Discord para gamificación educativa con sistema de monedas virtuales.

## 📋 Características

- **Sistema de Monedas**: Los estudiantes pueden ganar y gastar monedas virtuales
- **Solicitudes de Monedas**: Los estudiantes pueden solicitar monedas a los docentes
- **Ranking**: Sistema de clasificación global de monedas
- **Subastas**: Los docentes pueden crear subastas de artículos
- **Actividades**: Creación automatizada de actividades con resumen IA
- **Gestión por Cursos**: Sistema integrado para 6 paralelos (1E1, 1E2, 2E1, 2E2, 3E1, 3E2)

## 🚀 Instalación

### Requisitos Previos

- Node.js 16.x o superior
- Cuenta de Discord con permisos de desarrollador
- Cuenta de Supabase
- API Key de OpenRouter
- Webhook de n8n (opcional)

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/siramong/reactify-bot.git
cd reactify-bot
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DISCORD_TOKEN=tu_token_del_bot
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_clave_anon_de_supabase
OPENROUTER_API_KEY=tu_clave_de_openrouter
N8N_WEBHOOK_URL=tu_webhook_de_n8n
TEACHER_ROLE_ID=id_del_rol_docente
TEACHER_CHANNEL_ID=id_del_canal_docente
FORUM_1E1_ID=id_del_foro_1e1
FORUM_1E2_ID=id_del_foro_1e2
FORUM_2E1_ID=id_del_foro_2e1
FORUM_2E2_ID=id_del_foro_2e2
FORUM_3E1_ID=id_del_foro_3e1
FORUM_3E2_ID=id_del_foro_3e2
```

### Paso 4: Configurar Base de Datos Supabase

Ejecuta estos comandos SQL en tu proyecto de Supabase:

```sql
-- Crear tipo enum para cursos
CREATE TYPE curso_enum AS ENUM ('1E1', '1E2', '2E1', '2E2', '3E1', '3E2');

-- Tabla de monedas
CREATE TABLE public.coins (
  userId text NOT NULL UNIQUE,
  amount bigint NOT NULL DEFAULT '0'::bigint,
  username text,
  curso curso_enum,
  CONSTRAINT coins_pkey PRIMARY KEY (userId)
);

-- Tabla de actividades
CREATE TABLE public.activities (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  teacher text,
  curso curso_enum,
  threadId text,
  CONSTRAINT activities_pkey PRIMARY KEY (uuid)
);
```

### Paso 5: Registrar Comandos Slash

Crea un archivo `register-commands.js` en la raíz del proyecto:

```javascript
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('coins')
    .setDescription('Comandos de monedas')
    .addSubcommand(subcommand =>
      subcommand
        .setName('request')
        .setDescription('Solicitar monedas a los docentes'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('get')
        .setDescription('Ver tu balance de monedas'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('top')
        .setDescription('Ver el ranking de monedas'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Añadir monedas a un usuario (solo docentes)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Usuario')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Cantidad')
            .setRequired(true)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Razón')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remover monedas de un usuario (solo docentes)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Usuario')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Cantidad')
            .setRequired(true)
            .setMinValue(1))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Razón')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Resetear monedas (solo docentes)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Usuario específico (opcional)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('export')
        .setDescription('Exportar datos a n8n (solo docentes)'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('bid')
        .setDescription('Crear una subasta (solo docentes)')
        .addStringOption(option =>
          option.setName('item_name')
            .setDescription('Nombre del artículo')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('starting_bid')
            .setDescription('Puja inicial')
            .setRequired(true)
            .setMinValue(10))
        .addIntegerOption(option =>
          option.setName('duration')
            .setDescription('Duración en minutos')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1440))),
  new SlashCommandBuilder()
    .setName('activity')
    .setDescription('Crear nueva actividad (solo docentes)')
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos slash...');

    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { body: commands },
    );

    console.log('✅ Comandos registrados exitosamente');
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

Ejecuta el script:

```bash
node register-commands.js
```

### Paso 6: Iniciar el Bot

```bash
npm start
```

## 📚 Comandos Disponibles

### Comandos para Estudiantes

- `/coins request` - Solicitar monedas a los docentes
- `/coins get` - Ver tu balance actual y ranking
- `/coins top` - Ver el ranking global de monedas

### Comandos para Docentes

- `/coins add <usuario> <cantidad> [razón]` - Añadir monedas a un estudiante
- `/coins remove <usuario> <cantidad> [razón]` - Remover monedas de un estudiante
- `/coins reset [usuario]` - Resetear monedas (usuario específico o todos)
- `/coins export` - Exportar datos a n8n
- `/coins bid <nombre> <puja_inicial> <duración>` - Crear una subasta
- `/activity` - Crear una nueva actividad con resumen IA

## 🏗️ Estructura del Proyecto

```
reactify-bot/
├── src/
│   ├── index.js                 # Punto de entrada principal
│   ├── commands/                # Comandos slash
│   │   ├── coins/              # Comandos de monedas
│   │   └── activity/           # Comandos de actividades
│   ├── events/                  # Manejadores de eventos
│   ├── interactions/            # Manejadores de interacciones
│   │   ├── buttons/            # Botones
│   │   └── modals/             # Modales
│   ├── services/               # Servicios externos
│   │   ├── supabase.js        # Base de datos
│   │   ├── openrouter.js      # IA
│   │   └── n8n.js             # Webhooks
│   ├── utils/                  # Utilidades
│   └── config/                 # Configuración
├── package.json
├── .env.example
└── README.md
```

## 🔒 Seguridad

- Todos los comandos de docentes requieren verificación de rol
- Validación de entrada en todos los formularios
- Consultas parametrizadas para prevenir SQL injection
- Rate limiting en solicitudes de monedas (1 hora de cooldown)
- Mensajes de error amigables sin exponer información sensible

## 🛠️ Tecnologías Utilizadas

- **Discord.js v14** - Librería para interactuar con Discord
- **Supabase** - Base de datos PostgreSQL
- **OpenRouter** - API de IA para resúmenes automáticos
- **Axios** - Cliente HTTP para llamadas API
- **dotenv** - Gestión de variables de entorno

## 📝 Notas

- Todas las respuestas del bot están en español
- Los nombres de comandos permanecen en inglés según las convenciones de Discord
- El bot crea automáticamente registros de usuarios en la base de datos
- Las subastas actualizan en tiempo real con temporizador
- Los resúmenes IA se generan automáticamente para las actividades

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📄 Licencia

Ver archivo LICENSE para más detalles.

## 👥 Soporte

Para soporte, crea un issue en el repositorio de GitHub.