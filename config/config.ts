import dotenv from 'dotenv';
import { Nivel } from './enums';

dotenv.config();

interface ForumChannels {
  'Primero': string | undefined;
  'Segundo': string | undefined;
  'Tercero': string | undefined;
}

interface AnnouncementChannels {
  'Primero': string | undefined;
  'Segundo': string | undefined;
  'Tercero': string | undefined;
}

interface CursoToNivel {
  '1E1': 'Primero';
  '1E2': 'Primero';
  '2E1': 'Segundo';
  '2E2': 'Segundo';
  '3E1': 'Tercero';
  '3E2': 'Tercero';
}

interface Config {
  DISCORD_TOKEN: string | undefined;
  SUPABASE_URL: string | undefined;
  SUPABASE_KEY: string | undefined;
  OPENROUTER_API_KEY: string | undefined;
  N8N_WEBHOOK_URL: string | undefined;
  TEACHER_ROLE_ID: string | undefined;
  TEACHER_CHANNEL_ID: string | undefined;
  DEVELOPER_USER_ID: string | undefined;
  FORUM_CHANNELS: ForumChannels;
  ANNOUNCEMENT_CHANNELS: AnnouncementChannels;
  CURSO_TO_NIVEL: CursoToNivel;
  BID_INCREMENT: number;
  COIN_REQUEST_COOLDOWN: number;
}

const config: Config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  TEACHER_ROLE_ID: process.env.TEACHER_ROLE_ID,
  TEACHER_CHANNEL_ID: process.env.TEACHER_CHANNEL_ID,
  DEVELOPER_USER_ID: process.env.DEVELOPER_USER_ID,
  
  // Discord channels organized by NIVEL (not curso)
  FORUM_CHANNELS: {
    'Primero': process.env.FORUM_PRIMERO_ID,
    'Segundo': process.env.FORUM_SEGUNDO_ID,
    'Tercero': process.env.FORUM_TERCERO_ID,
  },
  
  ANNOUNCEMENT_CHANNELS: {
    'Primero': process.env.ANNOUNCEMENT_PRIMERO_ID,
    'Segundo': process.env.ANNOUNCEMENT_SEGUNDO_ID,
    'Tercero': process.env.ANNOUNCEMENT_TERCERO_ID,
  },
  
  // Map curso to nivel for channel lookups
  CURSO_TO_NIVEL: {
    '1E1': 'Primero',
    '1E2': 'Primero',
    '2E1': 'Segundo',
    '2E2': 'Segundo',
    '3E1': 'Tercero',
    '3E2': 'Tercero',
  },
  
  BID_INCREMENT: 10, // Minimum bid increase
  COIN_REQUEST_COOLDOWN: 3600000, // 1 hour in ms
};

export default config;
