Create a Discord bot called "Reactify" for educational gamification using Node.js and discord.js v14+. The bot implements a virtual currency system and activity management. All command responses, embeds, and user-facing content must be in Spanish, while command names remain in English.

## Database Schema (Supabase)

### Table: coins
```sql
CREATE TABLE public.coins (
  userId text NOT NULL UNIQUE,
  amount bigint NOT NULL DEFAULT '0'::bigint,
  username text,
  curso USER-DEFINED, -- Enum: '1E1', '1E2', '2E1', '2E2', '3E1', '3E2'
  CONSTRAINT coins_pkey PRIMARY KEY (userId)
);
```

### Table: activities
```sql
CREATE TABLE public.activities (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  teacher text,
  curso USER-DEFINED, -- Enum: '1E1', '1E2', '2E1', '2E2', '3E1', '3E2'
  threadId text,
  CONSTRAINT activities_pkey PRIMARY KEY (uuid)
);
```

**IMPORTANT**: The bot must automatically create user records in the `coins` table if they don't exist when any command is executed. Always check for user existence first and insert with default values (amount: 0, username: Discord display name, curso: prompt user to set if needed).

## Project Structure (Modular Design)

```
reactify-bot/
├── src/
│   ├── index.js                 # Main bot entry point
│   ├── commands/
│   │   ├── coins/
│   │   │   ├── request.js       # /coins request
│   │   │   ├── get.js           # /coins get
│   │   │   ├── top.js           # /coins top
│   │   │   ├── add.js           # /coins add (teacher)
│   │   │   ├── remove.js        # /coins remove (teacher)
│   │   │   ├── reset.js         # /coins reset (teacher)
│   │   │   ├── export.js        # /coins export (teacher)
│   │   │   └── bid.js           # /coins bid (teacher)
│   │   └── activity/
│   │       └── create.js        # /activity create (teacher)
│   ├── events/
│   │   ├── ready.js             # Bot ready event
│   │   └── interactionCreate.js # Handle all interactions
│   ├── interactions/
│   │   ├── buttons/
│   │   │   ├── coinRequest.js   # Approve/Deny coin requests
│   │   │   ├── auction.js       # Bid and end auction buttons
│   │   │   └── confirmReset.js  # Reset confirmation
│   │   └── modals/
│   │       ├── coinRequest.js   # Process coin request modal
│   │       ├── bidAmount.js     # Process bid modal
│   │       ├── activityCreate.js# Process activity modal
│   │       └── resetConfirm.js  # Process reset confirmation
│   ├── services/
│   │   ├── supabase.js          # All Supabase database operations
│   │   ├── openrouter.js        # OpenRouter API integration
│   │   └── n8n.js               # n8n webhook export
│   ├── utils/
│   │   ├── userManager.js       # Create/get user functions
│   │   ├── permissions.js       # Role checking utilities
│   │   ├── validation.js        # Input validation
│   │   └── formatting.js        # Message formatting utilities
│   └── config/
│       ├── strings.js           # All Spanish text strings
│       ├── config.js            # Bot configuration
│       └── enums.js             # Curso enums and mappings
├── .env.example
├── package.json
└── README.md
```

## Core Features

### 1. User Management (Automatic)
**Module**: `src/utils/userManager.js`

All commands must call `ensureUserExists(userId, username)` before any operation:
```javascript
async function ensureUserExists(userId, username) {
  // Check if user exists in coins table
  // If not, INSERT with defaults: amount=0, username=username, curso=null
  // Return user data
}
```

For commands requiring curso, prompt user with dropdown if curso is null.

### 2. Slash Commands

#### Student Commands (Public Access):

**`/coins request`**
- Module: `src/commands/coins/request.js`
- Opens modal (title: "Solicitar Monedas"):
  - "Razón" (text, required, max 100 chars)
  - "Cantidad" (number, required, min: 1, max: 1000)
  - "Descripción adicional" (paragraph, optional, max 500 chars)
- Calls `ensureUserExists()` before processing
- Creates embed in teacher channel:
  - Title: "📝 Nueva Solicitud de Monedas"
  - Fields: Usuario, Cantidad, Razón, Descripción, Curso
  - Buttons: "✅ Aceptar" (approve_{requestId}), "❌ Rechazar" (deny_{requestId})
- Response: "✅ Tu solicitud ha sido enviada a los docentes."

**`/coins get`**
- Module: `src/commands/coins/get.js`
- Calls `ensureUserExists()`
- Queries Supabase for user's amount
- Calculates ranking (COUNT where amount > user.amount + 1)
- Embed:
  - Title: "💰 Tu Balance de Monedas"
  - Field: "Saldo actual: **{amount} monedas**"
  - Field: "Posición en ranking: **#{rank}**"
  - Field: "Curso: **{curso}**"
  - Color: Gold (#FFD700)

**`/coins top`**
- Module: `src/commands/coins/top.js`
- Query: `SELECT * FROM coins ORDER BY amount DESC LIMIT 10`
- Get user's rank separately
- Embed:
  - Title: "🏆 Ranking de Monedas"
  - Description: Top 10 formatted as:
    ```
    1️⃣ **Usuario1** - 1,500 monedas (Curso: 2E1)
    2️⃣ **Usuario2** - 1,200 monedas (Curso: 3E2)
    ```
  - Footer: "Tu posición: #{rank} con {amount} monedas" (if outside top 10)
  - Color: Blue (#3498db)

#### Teacher Commands (Role-Based):

**`/coins add <user> <amount> [reason]`**
- Module: `src/commands/coins/add.js`
- Permission check: `checkTeacherRole(interaction.member)`
- Parameters:
  - user: UserOption (required)
  - amount: IntegerOption (required, min: 1)
  - reason: StringOption (optional, max 200 chars)
- Calls `ensureUserExists()` for target user
- Updates Supabase: `UPDATE coins SET amount = amount + {amount} WHERE userId = {user.id}`
- Response: "✅ Se han añadido **{amount} monedas** a {user.mention}"
- DM to recipient: "🎉 Has recibido **{amount} monedas**.\nRazón: {reason || 'No especificada'}"

**`/coins remove <user> <amount> [reason]`**
- Module: `src/commands/coins/remove.js`
- Permission check: Teacher role required
- Calls `ensureUserExists()`
- Validates user has sufficient balance
- Updates: `UPDATE coins SET amount = amount - {amount} WHERE userId = {user.id}`
- Error if insufficient: "❌ {user.username} solo tiene **{current} monedas**. No puedes remover {amount}."
- Success: "✅ Se han removido **{amount} monedas** de {user.mention}"
- DM to user: "⚠️ Se han deducido **{amount} monedas** de tu cuenta.\nRazón: {reason}"

**`/coins reset [user]`**
- Module: `src/commands/coins/reset.js`
- Permission check: Teacher role required
- If user specified:
  - Show confirmation button
  - On confirm: `UPDATE coins SET amount = 0 WHERE userId = {user.id}`
  - Response: "✅ Las monedas de {user.username} han sido reseteadas a 0"
- If no user (FULL RESET):
  - Show modal requiring typing "CONFIRMAR RESET"
  - On confirm: `UPDATE coins SET amount = 0`
  - Response: "✅ Todas las monedas del servidor han sido reseteadas"

**`/coins export`**
- Module: `src/commands/coins/export.js` + `src/services/n8n.js`
- Permission check: Teacher role required
- Query all data: `SELECT * FROM coins ORDER BY amount DESC`
- Send POST to n8n webhook with JSON payload
- Retry logic: 3 attempts with 2s delay
- Response: "✅ Datos exportados exitosamente el {timestamp}"
- Error: "❌ Error en la exportación después de 3 intentos"

**`/coins bid <item_name> <starting_bid> <duration>`**
- Module: `src/commands/coins/bid.js` + `src/interactions/buttons/auction.js`
- Permission check: Teacher role required
- Parameters:
  - item_name: StringOption (required)
  - starting_bid: IntegerOption (required, min: 10)
  - duration: IntegerOption (required, minutes, max: 1440)
- Creates embed with:
  - Title: "🔨 Subasta: {item_name}"
  - Fields: "💰 Puja actual: {current_bid}", "👤 Mejor postor: Ninguno", "⏰ Tiempo restante: {duration}m"
  - Button: "💵 Pujar" (bid_{auctionId})
  - Button: "🛑 Finalizar Subasta" (end_{auctionId}, teacher only)
- Store auction state in memory with setInterval for countdown
- Bid interaction:
  - Calls `ensureUserExists()`
  - Opens modal for bid amount
  - Validates: user has sufficient coins in Supabase
  - Minimum bid: current_bid + 10
  - Updates embed dynamically
  - Notifies previous bidder: "⚠️ Has sido superado en la subasta de {item_name}"
- End auction:
  - Deducts coins from winner: `UPDATE coins SET amount = amount - {bid} WHERE userId = {winner}`
  - Announcement: "🎉 ¡Subasta finalizada!\n**Ganador:** {winner.mention}\n**Precio final:** {bid} monedas"
  - Winner DM: "🏆 ¡Felicidades! Has ganado **{item_name}** por {bid} monedas"

**`/activity create`**
- Module: `src/commands/activity/create.js` + `src/services/openrouter.js`
- Permission check: Teacher role required
- Opens modal (title: "Crear Nueva Actividad"):
  - "Título" (text, required, max 100 chars)
  - "Descripción" (paragraph, required, max 1000 chars)
  - "Nivel" (dropdown): 1E1, 1E2, 2E1, 2E2, 3E1, 3E2
  - "Documentación" (paragraph, required, "URLs separadas por comas")
  - "Fecha límite" (text, optional, "AAAA-MM-DD")
  - "Recompensa" (number, optional, min: 0)
- Processing:
  1. Show: "⏳ Generando resumen con IA..."
  2. Split documentation by commas
  3. For each doc, call OpenRouter:
     - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
     - Model: `meta-llama/llama-3.1-8b-instruct`
     - System: "Eres un asistente educativo."
     - Prompt: "Resume el siguiente recurso en 2-3 oraciones para estudiantes de bachillerato: {doc}"
  4. Combine summaries
  5. Map curso to forum channel (config in `src/config/config.js`)
  6. Create thread in forum: `forumChannel.threads.create()`
  7. Post embed in thread:
     - Title: "📚 {title}"
     - Description: {description}
     - Fields: "📖 Documentación", "🤖 Resumen IA", "📅 Fecha límite", "💰 Recompensa"
     - Reactions: 👀, ✅
  8. Insert into Supabase:
     ```sql
     INSERT INTO activities (name, teacher, curso, threadId)
     VALUES ({title}, {interaction.user.id}, {curso}, {thread.id})
     ```
  9. Response: "✅ Actividad **{title}** creada exitosamente en el foro de **{curso}**"

## Configuration Files

**`src/config/strings.js`** - All Spanish text constants:
```javascript
module.exports = {
  ERRORS: {
    NO_PERMISSION: '❌ No tienes permisos para usar este comando.',
    INSUFFICIENT_COINS: '❌ No tienes suficientes monedas.',
    // ... all error messages
  },
  SUCCESS: {
    COINS_ADDED: '✅ Se han añadido **{amount} monedas** a {user}',
    // ... all success messages
  },
  // ... categorized by feature
};
```

**`src/config/config.js`** - Environment and mappings:
```javascript
module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  TEACHER_ROLE_ID: process.env.TEACHER_ROLE_ID,
  TEACHER_CHANNEL_ID: process.env.TEACHER_CHANNEL_ID,
  
  FORUM_CHANNELS: {
    '1E1': process.env.FORUM_1E1_ID,
    '1E2': process.env.FORUM_1E2_ID,
    '2E1': process.env.FORUM_2E1_ID,
    '2E2': process.env.FORUM_2E2_ID,
    '3E1': process.env.FORUM_3E1_ID,
    '3E2': process.env.FORUM_3E2_ID,
  },
  
  BID_INCREMENT: 10, // Minimum bid increase
  COIN_REQUEST_COOLDOWN: 3600000, // 1 hour in ms
};
```

**`src/config/enums.js`** - Curso enums:
```javascript
module.exports = {
  CURSOS: ['1E1', '1E2', '2E1', '2E2', '3E1', '3E2'],
  CURSO_NAMES: {
    '1E1': 'Primero de Bachillerato - Paralelo 1',
    '1E2': 'Primero de Bachillerato - Paralelo 2',
    '2E1': 'Segundo de Bachillerato - Paralelo 1',
    '2E2': 'Segundo de Bachillerato - Paralelo 2',
    '3E1': 'Tercero de Bachillerato - Paralelo 1',
    '3E2': 'Tercero de Bachillerato - Paralelo 2',
  }
};
```

## Services Layer

**`src/services/supabase.js`** - All database operations:
```javascript
const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  }
  
  async getUser(userId) { /* ... */ }
  async createUser(userId, username, curso = null) { /* ... */ }
  async ensureUser(userId, username) { /* ... */ }
  async updateCoins(userId, amount) { /* ... */ }
  async getTopUsers(limit = 10) { /* ... */ }
  async getUserRank(userId) { /* ... */ }
  async getAllUsers() { /* ... */ }
  async resetAllCoins() { /* ... */ }
  async createActivity(data) { /* ... */ }
  // ... all DB operations
}

module.exports = new SupabaseService();
```

**`src/services/openrouter.js`** - AI summarization:
```javascript
async function summarizeDocumentation(docs) {
  // Split by comma, trim
  // For each doc, call OpenRouter API
  // Return combined summary
}
```

**`src/services/n8n.js`** - Export functionality:
```javascript
async function exportToN8n(data, retries = 3) {
  // POST to webhook
  // Retry logic with delay
}
```

## Error Handling (Spanish)
- All errors in `src/config/strings.js`
- Wrap all async operations in try-catch
- Log errors to console (English for developers)
- Show user-friendly Spanish messages
- Validation errors before DB operations

## Security & Rate Limiting
- **`src/utils/permissions.js`**: 
  - `checkTeacherRole(member)` - Returns boolean
  - `checkRateLimit(userId, action)` - Uses Map with timestamps
- Input sanitization in `src/utils/validation.js`
- Parameterized queries (Supabase handles this)

## Environment Variables (.env.example):
```env
DISCORD_TOKEN=your_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_key
N8N_WEBHOOK_URL=your_n8n_webhook
TEACHER_ROLE_ID=role_id
TEACHER_CHANNEL_ID=channel_id
FORUM_1E1_ID=forum_channel_id
FORUM_1E2_ID=forum_channel_id
FORUM_2E1_ID=forum_channel_id
FORUM_2E2_ID=forum_channel_id
FORUM_3E1_ID=forum_channel_id
FORUM_3E2_ID=forum_channel_id
```

## Package Dependencies:
```json
{
  "dependencies": {
    "discord.js": "^14.14.1",
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  }
}
```

Generate clean, modular, well-documented code following this structure. Each module should be independent and easy to modify. Include comprehensive Spanish error messages for users and English comments for developers. Create README.md with setup instructions in Spanish.
