# Reactify Bot

Bot de Discord para gamificación educativa con sistema de monedas virtuales.

## 📋 Características

### Sistema de Monedas
- **Sistema de Monedas**: Los estudiantes pueden ganar y gastar monedas virtuales
- **Solicitudes de Monedas**: Los estudiantes pueden solicitar monedas a los docentes
- **Ranking**: Sistema de clasificación global de monedas
- **Subastas**: Los docentes pueden crear subastas de artículos

### Sistema de Casas 🏠
- **4 Casas**: Sistema organizacional con identidad propia para cada casa
- **Roles**: Miembros, Organizadores de Eventos y Líderes de Casa
- **Fragmentos**: Moneda interna de las casas convertible a monedas
- **Ranking Mensual**: Sistema de puntos y clasificación mensual por casa
- **Alianzas**: Alianzas temporales entre casas para eventos colaborativos
- **Logros y Badges**: Sistema de achievements y sellos de honor
- **Programa de Mentores**: Sistema de mentoría certificada (2do y 3ro de Bachillerato)
- **Libro de las Casas**: Historial de eventos y logros de cada casa
- **Eventos Intercasas**: Competencias y desafíos entre casas

### Otros Sistemas
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

-- Ejecuta también el esquema del Sistema de Casas desde database/houses_schema.sql
-- Este archivo contiene todas las tablas necesarias para el sistema de casas.
```

Luego ejecuta el archivo SQL del sistema de casas:

```bash
# El archivo database/houses_schema.sql contiene:
# - Tabla houses (casas)
# - Tabla house_members (miembros de casas)
# - Tabla fragmentos (moneda de casas)
# - Tabla house_points (puntos mensuales)
# - Tabla house_achievements (logros)
# - Tabla house_alliances (alianzas)
# - Tabla house_events (eventos)
# - Tabla mentors (mentores)
# - Tabla mentorship_sessions (sesiones de mentoría)
# - Tabla house_history (libro de la casa)
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

## 🏠 Configuración del Sistema de Casas

### Crear las Casas

Una vez que el bot esté ejecutándose, un administrador debe crear las 4 casas usando el comando `/house create`:

```
/house create 
  name: "Nombre de la Casa"
  description: "Descripción de la casa"
  color: "#FF5733" (color hexadecimal)
  emoji: "🔥" (emoji representativo)
```

**Ejemplo:**
```
/house create name:"Phoenix" description:"Casa de la innovación y creatividad" color:"#FF6B35" emoji:"🔥"
/house create name:"Dragon" description:"Casa de la fortaleza y determinación" color:"#004E89" emoji:"🐲"
/house create name:"Griffin" description:"Casa de la sabiduría y estrategia" color:"#8B4513" emoji:"🦅"
/house create name:"Kraken" description:"Casa de la colaboración y adaptabilidad" color:"#1B998B" emoji:"🐙"
```

### Roles del Sistema de Casas

El sistema de casas tiene tres roles:

1. **Miembro (member)**: Rol por defecto al unirse a una casa
2. **Organizador de Eventos (event_organizer)**: Coordina eventos internos y actividades
3. **Líder de la Casa (leader)**: Coordina competencias externas y supervisa el programa de mentoría

Los administradores y líderes pueden asignar roles usando:
```
/house assign user:@usuario role:"event_organizer"
```

### Sistema de Recompensas

Los líderes y administradores pueden otorgar recompensas a los miembros:
```
/house award user:@usuario fragmentos:50 points:100 reason:"Participación destacada en hackathon"
```

### Programa de Mentores

Solo estudiantes de 2do y 3ro de Bachillerato pueden registrarse como mentores:
```
/mentor register availability:"Lunes y Miércoles 15:00-17:00"
```

Los líderes deben certificar a los mentores antes de que puedan comenzar sesiones oficiales.

## 📚 Comandos Disponibles

### Comandos para Estudiantes

#### Sistema de Monedas
- `/coins request` - Solicitar monedas a los docentes
- `/coins get` - Ver tu balance actual y ranking
- `/coins top` - Ver el ranking global de monedas

#### Sistema de Casas 🏠
- `/house join` - Unirte a una casa
- `/house info` - Ver información de tu casa
- `/house members` - Ver los miembros de tu casa
- `/house ranking` - Ver el ranking mensual de tu casa
- `/house points` - Ver tus puntos del mes en tu casa

#### Fragmentos 💎
- `/fragmentos get` - Ver tu balance de fragmentos
- `/fragmentos convert <cantidad>` - Convertir fragmentos a monedas (10 fragmentos = 1 moneda)

#### Programa de Mentores 👨‍🏫
- `/mentor register <disponibilidad>` - Registrarte como mentor (solo 2do y 3ro)
- `/mentor list` - Ver mentores disponibles en tu casa

#### Logros y Historia
- `/achievements` - Ver tus logros y badges obtenidos
- `/housebook` - Ver el libro de historia de tu casa

### Comandos para Docentes y Líderes

#### Sistema de Monedas
- `/coins add <usuario> <cantidad> [razón]` - Añadir monedas a un estudiante
- `/coins remove <usuario> <cantidad> [razón]` - Remover monedas de un estudiante
- `/coins reset [usuario]` - Resetear monedas (usuario específico o todos)
- `/coins export` - Exportar datos a n8n
- `/coins bid <nombre> <puja_inicial> <duración>` - Crear una subasta
- `/activity` - Crear una nueva actividad con resumen IA

#### Sistema de Casas (Admin/Líder)
- `/house create <nombre> <descripción> <color> <emoji>` - Crear una nueva casa (admin)
- `/house award <usuario> <fragmentos> <puntos> [razón]` - Otorgar recompensas (admin/líder)
- `/house assign <usuario> <rol>` - Asignar rol a un miembro (admin/líder)

## 🏗️ Estructura del Proyecto

```
reactify-bot/
├── index.js                     # Punto de entrada principal
├── commands/                    # Comandos slash
│   ├── coins/                  # Comandos de monedas
│   ├── activity/               # Comandos de actividades
│   ├── house/                  # Comandos de casas
│   ├── fragmentos/             # Comandos de fragmentos
│   ├── mentor/                 # Comandos de mentores
│   ├── achievements/           # Comandos de logros
│   └── housebook/              # Comandos del libro de casas
├── events/                      # Manejadores de eventos
├── interactions/                # Manejadores de interacciones
│   ├── buttons/                # Botones
│   ├── modals/                 # Modales
│   └── selectMenus/            # Menús de selección
├── services/                   # Servicios externos
│   ├── supabase.js            # Base de datos
│   ├── houses.js              # Servicio de casas
│   ├── openrouter.js          # IA
│   └── n8n.js                 # Webhooks
├── utils/                      # Utilidades
├── config/                     # Configuración
├── database/                   # Esquemas SQL
│   └── houses_schema.sql      # Schema del sistema de casas
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