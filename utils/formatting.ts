interface User {
  amount: number;
  username: string;
  curso?: string;
}

// Format number with thousands separator
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format coins display
export function formatCoins(amount: number): string {
  return `**${formatNumber(amount)} monedas**`;
}

// Format user mention
export function formatUserMention(userId: string): string {
  return `<@${userId}>`;
}

// Format rank emoji
export function getRankEmoji(rank: number): string {
  const emojis: Record<number, string> = {
    1: '1️⃣',
    2: '2️⃣',
    3: '3️⃣',
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
    7: '7️⃣',
    8: '8️⃣',
    9: '9️⃣',
    10: '🔟'
  };
  return emojis[rank] || `**${rank}.**`;
}

// Format top users list
export function formatTopUsersList(users: User[]): string {
  return users.map((user, index) => {
    const rank = index + 1;
    const emoji = getRankEmoji(rank);
    const curso = user.curso ? ` (Curso: ${user.curso})` : '';
    return `${emoji} **${user.username}** - ${formatNumber(user.amount)} monedas${curso}`;
  }).join('\n');
}

// Format time duration
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Replace placeholders in string
export function replacePlaceholders(template: string, values: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}
