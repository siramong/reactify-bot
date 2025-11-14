/**
 * Beautiful console logger with colors and emojis
 * Makes console output modern, readable and understandable
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

/**
 * Get current timestamp formatted
 */
function getTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format a log message with timestamp and color
 */
function formatMessage(emoji: string, category: string, message: string, color: string): string {
  const timestamp = `${colors.dim}[${getTimestamp()}]${colors.reset}`;
  const categoryStr = `${color}${colors.bright}[${category}]${colors.reset}`;
  return `${timestamp} ${emoji} ${categoryStr} ${message}`;
}

const consoleLogger = {
  /**
   * Log success message
   */
  success(category: string, message: string): void {
    console.log(formatMessage('✅', category, message, colors.green));
  },

  /**
   * Log error message
   */
  error(category: string, message: string, error: Error | null = null): void {
    console.log(formatMessage('❌', category, message, colors.red));
    if (error && error.stack) {
      console.log(`${colors.dim}${error.stack}${colors.reset}`);
    }
  },

  /**
   * Log warning message
   */
  warn(category: string, message: string): void {
    console.log(formatMessage('⚠️', category, message, colors.yellow));
  },

  /**
   * Log info message
   */
  info(category: string, message: string): void {
    console.log(formatMessage('ℹ️', category, message, colors.cyan));
  },

  /**
   * Log command execution
   */
  command(commandName: string, user: string, guild: string): void {
    const message = `${colors.bright}/${commandName}${colors.reset} ejecutado por ${colors.cyan}${user}${colors.reset} en ${colors.magenta}${guild}${colors.reset}`;
    console.log(formatMessage('⚡', 'COMANDO', message, colors.blue));
  },

  /**
   * Log database operation
   */
  database(operation: string, details: string): void {
    const message = `${colors.bright}${operation}${colors.reset} - ${details}`;
    console.log(formatMessage('🗄️', 'BASE DE DATOS', message, colors.magenta));
  },

  /**
   * Log API call
   */
  api(service: string, action: string, status: string = 'success'): void {
    const emoji = status === 'success' ? '✓' : '✗';
    const message = `${colors.bright}${service}${colors.reset} - ${action} ${emoji}`;
    console.log(formatMessage('🌐', 'API', message, colors.blue));
  },

  /**
   * Log bot startup
   */
  startup(message: string): void {
    console.log(formatMessage('🚀', 'INICIO', message, colors.green));
  },

  /**
   * Log Discord event
   */
  event(eventName: string, details: string): void {
    const message = `${colors.bright}${eventName}${colors.reset} - ${details}`;
    console.log(formatMessage('📡', 'EVENTO', message, colors.cyan));
  },

  /**
   * Log interaction
   */
  interaction(type: string, user: string, details: string): void {
    const message = `${colors.bright}${type}${colors.reset} por ${colors.cyan}${user}${colors.reset} - ${details}`;
    console.log(formatMessage('💬', 'INTERACCIÓN', message, colors.yellow));
  },

  /**
   * Log transaction
   */
  transaction(type: string, amount: number, user: string): void {
    const message = `${colors.bright}${type}${colors.reset} - ${colors.yellow}${amount} monedas${colors.reset} - ${colors.cyan}${user}${colors.reset}`;
    console.log(formatMessage('💰', 'TRANSACCIÓN', message, colors.green));
  },

  /**
   * Print a beautiful banner
   */
  banner(text: string): void {
    const border = '═'.repeat(text.length + 4);
    console.log(`\n${colors.bright}${colors.cyan}╔${border}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║  ${text}  ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚${border}╝${colors.reset}\n`);
  },

  /**
   * Print system info
   */
  systemInfo(info: Record<string, any>): void {
    console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    Object.entries(info).forEach(([key, value]) => {
      console.log(`  ${colors.bright}${key}:${colors.reset} ${colors.green}${value}${colors.reset}`);
    });
    console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  },

  /**
   * Log debug message (only in development)
   */
  debug(category: string, message: string): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = `${colors.dim}[${getTimestamp()}]${colors.reset}`;
      const categoryStr = `${colors.dim}[${category}]${colors.reset}`;
      console.log(`${timestamp} 🔍 ${categoryStr} ${colors.dim}${message}${colors.reset}`);
    }
  },
};

export default consoleLogger;
