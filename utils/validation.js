const { CURSOS } = require('../config/enums');

// Validate coin amount
function validateAmount(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'INVALID_AMOUNT' };
  }
  if (amount <= 0) {
    return { valid: false, error: 'INVALID_AMOUNT' };
  }
  return { valid: true };
}

// Validate curso
function validateCurso(curso) {
  if (!CURSOS.includes(curso)) {
    return { valid: false, error: 'INVALID_CURSO' };
  }
  return { valid: true };
}

// Validate date format (YYYY-MM-DD)
function validateDate(dateString) {
  if (!dateString) return { valid: true }; // Optional field
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return { valid: false, error: 'INVALID_DATE' };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'INVALID_DATE' };
  }
  
  return { valid: true };
}

// Sanitize text input
function sanitizeText(text) {
  if (!text) return '';
  return text.trim().slice(0, 2000); // Discord message limit
}

// Validate text length
function validateTextLength(text, maxLength) {
  if (!text) return { valid: false, error: 'Text is required' };
  if (text.length > maxLength) {
    return { valid: false, error: `Text exceeds maximum length of ${maxLength}` };
  }
  return { valid: true };
}

module.exports = {
  validateAmount,
  validateCurso,
  validateDate,
  sanitizeText,
  validateTextLength
};
