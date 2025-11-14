import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config/config';
import consoleLogger from '../utils/consoleLogger';
import { Curso } from '../config/enums';

interface User {
  userId: string;
  username: string;
  amount: number;
  curso?: Curso | null;
}

interface Activity {
  uuid: string;
  name: string;
  teacher: string;
  curso: Curso;
  threadId: string;
}

class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.SUPABASE_URL!, config.SUPABASE_KEY!);
    consoleLogger.success('SUPABASE', 'Cliente inicializado correctamente');
  }

  // Get user from database
  async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from('coins')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error obteniendo usuario', error as Error);
      throw error;
    }
  }

  // Create new user with defaults
  async createUser(userId: string, username: string, curso: Curso | null = null): Promise<User> {
    try {
      const { data, error } = await this.client
        .from('coins')
        .insert([
          {
            userId: userId,
            username: username,
            amount: 0,
            curso: curso
          }
        ])
        .select()
        .single();

      if (error) throw error;
      consoleLogger.database('CREAR USUARIO', `${username} (${userId})`);
      return data;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error creando usuario', error as Error);
      throw error;
    }
  }

  // Ensure user exists (get or create)
  async ensureUser(userId: string, username: string): Promise<User> {
    try {
      let user = await this.getUser(userId);
      
      if (!user) {
        user = await this.createUser(userId, username);
      }
      
      return user;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error asegurando existencia de usuario', error as Error);
      throw error;
    }
  }

  // Update user coins (add or subtract)
  async updateCoins(userId: string, amount: number): Promise<User> {
    try {
      const { data, error} = await this.client
        .from('coins')
        .update({ amount })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error actualizando monedas', error as Error);
      throw error;
    }
  }

  // Add coins to user
  async addCoins(userId: string, amount: number): Promise<User> {
    try {
      const user = await this.getUser(userId);
      const newAmount = (user?.amount || 0) + amount;
      return await this.updateCoins(userId, newAmount);
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error añadiendo monedas', error as Error);
      throw error;
    }
  }

  // Remove coins from user
  async removeCoins(userId: string, amount: number): Promise<User> {
    try {
      const user = await this.getUser(userId);
      const currentAmount = user?.amount || 0;
      
      if (currentAmount < amount) {
        throw new Error('INSUFFICIENT_COINS');
      }
      
      const newAmount = currentAmount - amount;
      return await this.updateCoins(userId, newAmount);
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error removiendo monedas', error as Error);
      throw error;
    }
  }

  // Get top users by coins
  async getTopUsers(limit: number = 10): Promise<User[]> {
    try {
      const { data, error } = await this.client
        .from('coins')
        .select('*')
        .order('amount', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error obteniendo top usuarios', error as Error);
      throw error;
    }
  }

  // Get user rank
  async getUserRank(userId: string): Promise<number | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      const { count, error } = await this.client
        .from('coins')
        .select('*', { count: 'exact', head: true })
        .gt('amount', user.amount);

      if (error) throw error;
      return (count || 0) + 1;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error obteniendo rank de usuario', error as Error);
      throw error;
    }
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await this.client
        .from('coins')
        .select('*')
        .order('amount', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error obteniendo todos los usuarios', error as Error);
      throw error;
    }
  }

  // Reset user coins to 0
  async resetUserCoins(userId: string): Promise<User> {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ amount: 0 })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      consoleLogger.database('RESET MONEDAS', `Usuario: ${userId}`);
      return data;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error reseteando monedas de usuario', error as Error);
      throw error;
    }
  }

  // Reset all coins to 0
  async resetAllCoins(): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ amount: 0 })
        .neq('userId', '');

      if (error) throw error;
      consoleLogger.database('RESET MONEDAS', 'Todos los usuarios');
      return data;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error reseteando todas las monedas', error as Error);
      throw error;
    }
  }

  // Update user curso
  async updateUserCurso(userId: string, curso: Curso): Promise<User> {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ curso })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      consoleLogger.database('ACTUALIZAR CURSO', `${userId} -> ${curso}`);
      return data;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error actualizando curso de usuario', error as Error);
      throw error;
    }
  }

  // Create activity
  async createActivity(name: string, teacher: string, curso: Curso, threadId: string): Promise<Activity> {
    try {
      const { data, error } = await this.client
        .from('activities')
        .insert([
          {
            name,
            teacher,
            curso,
            threadId
          }
        ])
        .select()
        .single();

      if (error) throw error;
      consoleLogger.database('CREAR ACTIVIDAD', `${name} - Curso: ${curso}`);
      return data;
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error creando actividad', error as Error);
      throw error;
    }
  }

  // Get activities by curso
  async getActivitiesByCurso(curso: Curso): Promise<Activity[]> {
    try {
      const { data, error } = await this.client
        .from('activities')
        .select('*')
        .eq('curso', curso);

      if (error) throw error;
      return data || [];
    } catch (error) {
      consoleLogger.error('BASE DE DATOS', 'Error obteniendo actividades', error as Error);
      throw error;
    }
  }
}

export default new SupabaseService();
