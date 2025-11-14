export type Curso = '1E1' | '1E2' | '2E1' | '2E2' | '3E1' | '3E2';
export type Nivel = 'Primero' | 'Segundo' | 'Tercero';

export const CURSOS: Curso[] = ['1E1', '1E2', '2E1', '2E2', '3E1', '3E2'];

export const NIVELES: Nivel[] = ['Primero', 'Segundo', 'Tercero'];

export const CURSO_TO_NIVEL: Record<Curso, Nivel> = {
  '1E1': 'Primero',
  '1E2': 'Primero',
  '2E1': 'Segundo',
  '2E2': 'Segundo',
  '3E1': 'Tercero',
  '3E2': 'Tercero',
};

export const NIVEL_NAMES: Record<Nivel, string> = {
  'Primero': 'Primero de Bachillerato',
  'Segundo': 'Segundo de Bachillerato',
  'Tercero': 'Tercero de Bachillerato',
};

export const CURSO_NAMES: Record<Curso, string> = {
  '1E1': 'Primero de Bachillerato - Paralelo 1',
  '1E2': 'Primero de Bachillerato - Paralelo 2',
  '2E1': 'Segundo de Bachillerato - Paralelo 1',
  '2E2': 'Segundo de Bachillerato - Paralelo 2',
  '3E1': 'Tercero de Bachillerato - Paralelo 1',
  '3E2': 'Tercero de Bachillerato - Paralelo 2',
};
