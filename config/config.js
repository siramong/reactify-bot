require('dotenv').config();

module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  TEACHER_ROLE_ID: process.env.TEACHER_ROLE_ID,
  TEACHER_CHANNEL_ID: process.env.TEACHER_CHANNEL_ID,
  DEVELOPER_USER_ID: process.env.DEVELOPER_USER_ID,
  
  FORUM_CHANNELS: {
    '1E1': process.env.FORUM_1E1_ID,
    '1E2': process.env.FORUM_1E2_ID,
    '2E1': process.env.FORUM_2E1_ID,
    '2E2': process.env.FORUM_2E2_ID,
    '3E1': process.env.FORUM_3E1_ID,
    '3E2': process.env.FORUM_3E2_ID,
  },
  
  ANNOUNCEMENT_CHANNELS: {
    '1E1': process.env.ANNOUNCEMENT_1E1_ID,
    '1E2': process.env.ANNOUNCEMENT_1E2_ID,
    '2E1': process.env.ANNOUNCEMENT_2E1_ID,
    '2E2': process.env.ANNOUNCEMENT_2E2_ID,
    '3E1': process.env.ANNOUNCEMENT_3E1_ID,
    '3E2': process.env.ANNOUNCEMENT_3E2_ID,
  },
  
  BID_INCREMENT: 10, // Minimum bid increase
  COIN_REQUEST_COOLDOWN: 3600000, // 1 hour in ms
};
