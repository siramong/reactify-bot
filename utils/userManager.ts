import supabaseService from '../services/supabase';
import { Curso } from '../config/enums';

interface User {
  userId: string;
  username: string;
  amount: number;
  curso?: Curso | null;
}

// Ensure user exists in database
export async function ensureUserExists(userId: string, username: string): Promise<User> {
  try {
    return await supabaseService.ensureUser(userId, username);
  } catch (error) {
    console.error('Error in ensureUserExists:', error);
    throw error;
  }
}

// Get user with error handling
export async function getUser(userId: string): Promise<User | null> {
  try {
    return await supabaseService.getUser(userId);
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}

// Update user curso
export async function updateUserCurso(userId: string, curso: Curso): Promise<User> {
  try {
    return await supabaseService.updateUserCurso(userId, curso);
  } catch (error) {
    console.error('Error in updateUserCurso:', error);
    throw error;
  }
}
