const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');
const log = require('../utils/consoleLogger');

class SupabaseService {
  constructor() {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
    log.success('SUPABASE', 'Cliente inicializado correctamente');
  }

  // Get user from database
  async getUser(userId) {
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
      log.error('BASE DE DATOS', 'Error obteniendo usuario', error);
      throw error;
    }
  }

  // Create new user with defaults
  async createUser(userId, username, nivel = null) {
    try {
      const { data, error } = await this.client
        .from('coins')
        .insert([
          {
            userId: userId,
            username: username,
            amount: 0,
            nivel: nivel
          }
        ])
        .select()
        .single();

      if (error) throw error;
      log.database('CREAR USUARIO', `${username} (${userId})`);
      return data;
    } catch (error) {
      log.error('BASE DE DATOS', 'Error creando usuario', error);
      throw error;
    }
  }

  // Ensure user exists (get or create)
  async ensureUser(userId, username) {
    try {
      let user = await this.getUser(userId);
      
      if (!user) {
        user = await this.createUser(userId, username);
      }
      
      return user;
    } catch (error) {
      log.error('BASE DE DATOS', 'Error asegurando existencia de usuario', error);
      throw error;
    }
  }

  // Update user coins (add or subtract)
  async updateCoins(userId, amount) {
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
      log.error('BASE DE DATOS', 'Error actualizando monedas', error);
      throw error;
    }
  }

  // Add coins to user
  async addCoins(userId, amount) {
    try {
      const user = await this.getUser(userId);
      const newAmount = (user?.amount || 0) + amount;
      return await this.updateCoins(userId, newAmount);
    } catch (error) {
      log.error('BASE DE DATOS', 'Error añadiendo monedas', error);
      throw error;
    }
  }

  // Remove coins from user
  async removeCoins(userId, amount) {
    try {
      const user = await this.getUser(userId);
      const currentAmount = user?.amount || 0;
      
      if (currentAmount < amount) {
        throw new Error('INSUFFICIENT_COINS');
      }
      
      const newAmount = currentAmount - amount;
      return await this.updateCoins(userId, newAmount);
    } catch (error) {
      log.error('BASE DE DATOS', 'Error removiendo monedas', error);
      throw error;
    }
  }

  // Get top users by coins
  async getTopUsers(limit = 10) {
    try {
      const { data, error } = await this.client
        .from('coins')
        .select('*')
        .order('amount', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('BASE DE DATOS', 'Error obteniendo top usuarios', error);
      throw error;
    }
  }

  // Get user rank
  async getUserRank(userId) {
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
      log.error('BASE DE DATOS', 'Error obteniendo rank de usuario', error);
      throw error;
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const { data, error } = await this.client
        .from('coins')
        .select('*')
        .order('amount', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('BASE DE DATOS', 'Error obteniendo todos los usuarios', error);
      throw error;
    }
  }

  // Reset user coins to 0
  async resetUserCoins(userId) {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ amount: 0 })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      log.database('RESET MONEDAS', `Usuario: ${userId}`);
      return data;
    } catch (error) {
      log.error('BASE DE DATOS', 'Error reseteando monedas de usuario', error);
      throw error;
    }
  }

  // Reset all coins to 0
  async resetAllCoins() {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ amount: 0 })
        .neq('userId', '');

      if (error) throw error;
      log.database('RESET MONEDAS', 'Todos los usuarios');
      return data;
    } catch (error) {
      log.error('BASE DE DATOS', 'Error reseteando todas las monedas', error);
      throw error;
    }
  }

  // Update user nivel
  async updateUserNivel(userId, nivel) {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ nivel })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      log.database('ACTUALIZAR NIVEL', `${userId} -> ${nivel}`);
      return data;
    } catch (error) {
      log.error('BASE DE DATOS', 'Error actualizando nivel de usuario', error);
      throw error;
    }
  }

  // Create activity
  async createActivity(name, teacher, nivel, threadId) {
    try {
      const { data, error } = await this.client
        .from('activities')
        .insert([
          {
            name,
            teacher,
            nivel,
            threadId
          }
        ])
        .select()
        .single();

      if (error) throw error;
      log.database('CREAR ACTIVIDAD', `${name} - Nivel: ${nivel}`);
      return data;
    } catch (error) {
      log.error('BASE DE DATOS', 'Error creando actividad', error);
      throw error;
    }
  }

  // Get activities by nivel
  async getActivitiesByNivel(nivel) {
    try {
      const { data, error } = await this.client
        .from('activities')
        .select('*')
        .eq('nivel', nivel);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('BASE DE DATOS', 'Error obteniendo actividades', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();
