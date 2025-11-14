export const ERRORS = {
  NO_PERMISSION: '`❌` No tienes permisos para usar este comando.',
  INSUFFICIENT_COINS: '`❌` No tienes suficientes monedas.',
  USER_NOT_FOUND: '`❌` Usuario no encontrado.',
  INVALID_AMOUNT: '`❌` Cantidad inválida.',
  INVALID_USER: '`❌` Usuario inválido.',
  DATABASE_ERROR: '`❌` Error de base de datos. Intenta de nuevo más tarde.',
  EXPORT_FAILED: '`❌` Error en la exportación después de 3 intentos.',
  INSUFFICIENT_USER_COINS: '`❌` {user} solo tiene **{current} monedas**. No puedes remover {amount}.',
  BID_TOO_LOW: '`❌` La puja debe ser al menos **{minimum} monedas**.',
  AUCTION_ENDED: '`❌` Esta subasta ya ha finalizado.',
  NO_NIVEL: '`❌` Debes configurar tu nivel primero.',
  INVALID_NIVEL: '`❌` Nivel inválido.',
  RATE_LIMIT: '`❌` Debes esperar {time} antes de usar este comando nuevamente.',
  OPENROUTER_ERROR: '`❌` Error al generar resumen con IA.',
  INVALID_DATE: '`❌` Formato de fecha inválido. Usa AAAA-MM-DD.',
};

export const SUCCESS = {
  COINS_ADDED: '`✅` Se han añadido **{amount} monedas** a {user}',
  COINS_REMOVED: '`✅` Se han removido **{amount} monedas** de {user}',
  COINS_RESET_USER: '`✅` Las monedas de {user} han sido reseteadas a 0',
  COINS_RESET_ALL: '`✅` Todas las monedas del servidor han sido reseteadas',
  REQUEST_SENT: '`✅` Tu solicitud ha sido enviada a los docentes.',
  EXPORT_SUCCESS: '`✅` Datos exportados exitosamente el {timestamp}',
  ACTIVITY_CREATED: '`✅` Actividad **{title}** creada exitosamente en el foro de **{nivel}**',
};

export const INFO = {
  PROCESSING: '`⏳` Procesando...',
  GENERATING_AI: '`⏳` Generando resumen con IA...',
};

export const DM = {
  COINS_RECEIVED: '`🎉` Has recibido **{amount} monedas**.\nRazón: {reason}',
  COINS_DEDUCTED: '`⚠️` Se han deducido **{amount} monedas** de tu cuenta.\nRazón: {reason}',
  AUCTION_OUTBID: '`⚠️` Has sido superado en la subasta de {item}',
  AUCTION_WON: '`🏆` ¡Felicidades! Has ganado **{item}** por {amount} monedas',
};

export const EMBEDS = {
  REQUEST_TITLE: '`📝` Nueva Solicitud de Monedas',
  BALANCE_TITLE: '`💰` Tu Balance de Monedas',
  TOP_TITLE: '`🏆` Ranking de Monedas',
  AUCTION_TITLE: '`🔨` Subasta: {item}',
  AUCTION_ENDED_TITLE: '`🎉` ¡Subasta finalizada!',
  ACTIVITY_TITLE: '`📚` {title}',
};

export const MODALS = {
  REQUEST_TITLE: 'Solicitar Monedas',
  BID_TITLE: 'Realizar Puja',
  ACTIVITY_TITLE: 'Crear Nueva Actividad',
  RESET_CONFIRM_TITLE: 'Confirmar Reset Total',
};

export const FIELDS = {
  USER: 'Usuario',
  AMOUNT: 'Cantidad',
  REASON: 'Razón',
  DESCRIPTION: 'Descripción',
  PROOF: 'Prueba',
  NIVEL: 'Nivel',
  CURRENT_BALANCE: 'Saldo actual',
  RANK: 'Posición en ranking',
  CURRENT_BID: '`💰` Puja actual',
  TOP_BIDDER: '`👤` Mejor postor',
  TIME_REMAINING: '`⏰` Tiempo restante',
  DOCUMENTATION: '`📖` Documentación',
  AI_SUMMARY: '`🤖` Resumen IA',
  DEADLINE: '`📅` Fecha límite',
  REWARD: '`💰` Recompensa',
  IMAGE: '`🖼️` Imagen de referencia',
};

export const BUTTONS = {
  APPROVE: '✅ Aceptar',
  DENY: '❌ Rechazar',
  BID: '💵 Pujar',
  END_AUCTION: '🛑 Finalizar Subasta',
  CONFIRM: '✅ Confirmar',
  CANCEL: '❌ Cancelar',
};

export const PLACEHOLDERS = {
  NONE: 'Ninguno',
  NOT_SPECIFIED: 'No especificada',
};
