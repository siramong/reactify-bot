import { CURSOS, Curso } from '../config/enums';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Validate coin amount
export function validateAmount(amount: any): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'INVALID_AMOUNT' };
  }
  if (amount <= 0) {
    return { valid: false, error: 'INVALID_AMOUNT' };
  }
  return { valid: true };
}

// Validate curso
export function validateCurso(curso: string): ValidationResult {
  if (!CURSOS.includes(curso as Curso)) {
    return { valid: false, error: 'INVALID_CURSO' };
  }
  return { valid: true };
}

// Validate date format (YYYY-MM-DD)
export function validateDate(dateString: string | null | undefined): ValidationResult {
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
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim().slice(0, 2000); // Discord message limit
}

// Validate text length
export function validateTextLength(text: string | null | undefined, maxLength: number): ValidationResult {
  if (!text) return { valid: false, error: 'Text is required' };
  if (text.length > maxLength) {
    return { valid: false, error: `Text exceeds maximum length of ${maxLength}` };
  }
  return { valid: true };
}
