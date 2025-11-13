const config = require('../config/config');

// Check if user has teacher role
function checkTeacherRole(member) {
  if (!member || !member.roles) return false;
  return member.roles.cache.has(config.TEACHER_ROLE_ID);
}

// Rate limiting map: userId -> { action -> timestamp }
const rateLimitMap = new Map();

// Check rate limit for a user action
function checkRateLimit(userId, action, cooldown = config.COIN_REQUEST_COOLDOWN) {
  const now = Date.now();
  
  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, {});
  }
  
  const userLimits = rateLimitMap.get(userId);
  
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
function formatTimeRemaining(seconds) {
  if (seconds < 60) {
    return `${seconds} segundos`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minutos`;
}

module.exports = {
  checkTeacherRole,
  checkRateLimit,
  formatTimeRemaining
};
