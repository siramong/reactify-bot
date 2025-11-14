import { GuildMember } from 'discord.js';
import config from '../config/config';

interface RateLimitResult {
  allowed: boolean;
  timeRemaining?: number;
}

// Check if user has teacher role
export function checkTeacherRole(member: GuildMember | null | undefined): boolean {
  if (!member) return false;

  // Allow developer override by user ID (useful for testing)
  try {
    const memberId = member.user ? member.user.id : null;
    if (config.DEVELOPER_USER_ID && memberId && memberId === config.DEVELOPER_USER_ID) {
      return true;
    }
  } catch (err) {
    // ignore and continue to role check
  }

  if (!member.roles || !config.TEACHER_ROLE_ID) return false;
  return member.roles.cache.has(config.TEACHER_ROLE_ID);
}

// Rate limiting map: userId -> { action -> timestamp }
const rateLimitMap = new Map<string, Record<string, number>>();

// Check rate limit for a user action
export function checkRateLimit(userId: string, action: string, cooldown: number = config.COIN_REQUEST_COOLDOWN): RateLimitResult {
  const now = Date.now();
  
  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, {});
  }
  
  const userLimits = rateLimitMap.get(userId)!;
  
  if (userLimits[action]) {
    const timeSinceLastUse = now - userLimits[action];
    if (timeSinceLastUse < cooldown) {
      const timeRemaining = cooldown - timeSinceLastUse;
      return {
        allowed: false,
        timeRemaining: Math.ceil(timeRemaining / 1000) // seconds
      };
    }
  }
  
  userLimits[action] = now;
  return { allowed: true };
}

// Format time remaining
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} segundos`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minutos`;
}
