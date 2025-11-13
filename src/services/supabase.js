const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

class SupabaseService {
  constructor() {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
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
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Create new user with defaults
  async createUser(userId, username, curso = null) {
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
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
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
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }

  // Update user coins (add or subtract)
  async updateCoins(userId, amount) {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ amount })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating coins:', error);
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
      console.error('Error adding coins:', error);
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
      console.error('Error removing coins:', error);
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
      console.error('Error getting top users:', error);
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
      console.error('Error getting user rank:', error);
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
      console.error('Error getting all users:', error);
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
      return data;
    } catch (error) {
      console.error('Error resetting user coins:', error);
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
      return data;
    } catch (error) {
      console.error('Error resetting all coins:', error);
      throw error;
    }
  }

  // Update user curso
  async updateUserCurso(userId, curso) {
    try {
      const { data, error } = await this.client
        .from('coins')
        .update({ curso })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user curso:', error);
      throw error;
    }
  }

  // Create activity
  async createActivity(name, teacher, curso, threadId) {
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
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  // Get activities by curso
  async getActivitiesByCurso(curso) {
    try {
      const { data, error } = await this.client
        .from('activities')
        .select('*')
        .eq('curso', curso);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();
