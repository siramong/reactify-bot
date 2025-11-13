// Format number with thousands separator
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format coins display
function formatCoins(amount) {
  return `**${formatNumber(amount)} monedas**`;
}

// Format user mention
function formatUserMention(userId) {
  return `<@${userId}>`;
}

// Format rank emoji
function getRankEmoji(rank) {
  const emojis = {
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
function formatTopUsersList(users) {
  return users.map((user, index) => {
    const rank = index + 1;
    const emoji = getRankEmoji(rank);
    const curso = user.curso ? ` (Curso: ${user.curso})` : '';
    return `${emoji} **${user.username}** - ${formatNumber(user.amount)} monedas${curso}`;
  }).join('\n');
}

// Format time duration
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Replace placeholders in string
function replacePlaceholders(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

module.exports = {
  formatNumber,
  formatCoins,
  formatUserMention,
  getRankEmoji,
  formatTopUsersList,
  formatDuration,
  replacePlaceholders
};
