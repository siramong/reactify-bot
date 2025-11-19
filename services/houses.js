const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');
const log = require('../utils/consoleLogger');

class HousesService {
  constructor() {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
    log.success('HOUSES', 'Servicio de casas inicializado correctamente');
  }

  // ========== HOUSES ==========
  
  // Get all houses
  async getAllHouses() {
    try {
      const { data, error } = await this.client
        .from('houses')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo casas', error);
      throw error;
    }
  }

  // Get house by ID
  async getHouseById(houseId) {
    try {
      const { data, error } = await this.client
        .from('houses')
        .select('*')
        .eq('id', houseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo casa', error);
      throw error;
    }
  }

  // Create house
  async createHouse(name, description, color, emoji) {
    try {
      const { data, error } = await this.client
        .from('houses')
        .insert([{ name, description, color, emoji, points: 0 }])
        .select()
        .single();

      if (error) throw error;
      log.database('CREAR CASA', `${name}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error creando casa', error);
      throw error;
    }
  }

  // Update house points
  async updateHousePoints(houseId, points) {
    try {
      const { data, error } = await this.client
        .from('houses')
        .update({ points })
        .eq('id', houseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error actualizando puntos de casa', error);
      throw error;
    }
  }

  // ========== HOUSE MEMBERS ==========

  // Get user's house
  async getUserHouse(userId) {
    try {
      const { data, error } = await this.client
        .from('house_members')
        .select('*, houses(*)')
        .eq('userId', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo casa de usuario', error);
      throw error;
    }
  }

  // Join house
  async joinHouse(userId, username, houseId, role = 'member') {
    try {
      const { data, error } = await this.client
        .from('house_members')
        .insert([{
          userId,
          username,
          houseId,
          role,
          joinedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      log.database('UNIRSE A CASA', `${username} -> Casa ${houseId}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error uniéndose a casa', error);
      throw error;
    }
  }

  // Get house members
  async getHouseMembers(houseId) {
    try {
      const { data, error } = await this.client
        .from('house_members')
        .select('*')
        .eq('houseId', houseId)
        .order('joinedAt', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo miembros de casa', error);
      throw error;
    }
  }

  // Update member role
  async updateMemberRole(userId, houseId, role) {
    try {
      const { data, error } = await this.client
        .from('house_members')
        .update({ role })
        .eq('userId', userId)
        .eq('houseId', houseId)
        .select()
        .single();

      if (error) throw error;
      log.database('ACTUALIZAR ROL', `Usuario ${userId} -> ${role}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error actualizando rol de miembro', error);
      throw error;
    }
  }

  // ========== FRAGMENTOS ==========

  // Get user fragmentos
  async getUserFragmentos(userId) {
    try {
      const { data, error } = await this.client
        .from('fragmentos')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || { userId, amount: 0, houseId: null };
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo fragmentos', error);
      throw error;
    }
  }

  // Create or update fragmentos
  async updateFragmentos(userId, amount, houseId) {
    try {
      const { data, error } = await this.client
        .from('fragmentos')
        .upsert([{ userId, amount, houseId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error actualizando fragmentos', error);
      throw error;
    }
  }

  // Add fragmentos to user
  async addFragmentos(userId, amount, houseId) {
    try {
      const current = await this.getUserFragmentos(userId);
      const newAmount = (current?.amount || 0) + amount;
      return await this.updateFragmentos(userId, newAmount, houseId);
    } catch (error) {
      log.error('HOUSES', 'Error añadiendo fragmentos', error);
      throw error;
    }
  }

  // ========== HOUSE POINTS ==========

  // Get user points for current month
  async getUserMonthlyPoints(userId, houseId) {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const { data, error } = await this.client
        .from('house_points')
        .select('*')
        .eq('userId', userId)
        .eq('houseId', houseId)
        .eq('month', month)
        .eq('year', year)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || { userId, houseId, points: 0, month, year };
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo puntos mensuales', error);
      throw error;
    }
  }

  // Add points to user for current month
  async addMonthlyPoints(userId, houseId, points) {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const current = await this.getUserMonthlyPoints(userId, houseId);
      const newPoints = (current?.points || 0) + points;

      const { data, error } = await this.client
        .from('house_points')
        .upsert([{
          userId,
          houseId,
          points: newPoints,
          month,
          year
        }])
        .select()
        .single();

      if (error) throw error;
      log.database('AÑADIR PUNTOS', `${points} puntos a usuario ${userId}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error añadiendo puntos mensuales', error);
      throw error;
    }
  }

  // Get monthly ranking for a house
  async getHouseMonthlyRanking(houseId) {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const { data, error } = await this.client
        .from('house_points')
        .select('*, house_members(username)')
        .eq('houseId', houseId)
        .eq('month', month)
        .eq('year', year)
        .order('points', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo ranking mensual', error);
      throw error;
    }
  }

  // ========== ACHIEVEMENTS ==========

  // Award achievement to user
  async awardAchievement(userId, houseId, achievementType, metadata = {}) {
    try {
      const { data, error } = await this.client
        .from('house_achievements')
        .insert([{
          userId,
          houseId,
          achievementType,
          metadata,
          awardedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      log.database('LOGRO OTORGADO', `${achievementType} a usuario ${userId}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error otorgando logro', error);
      throw error;
    }
  }

  // Get user achievements
  async getUserAchievements(userId) {
    try {
      const { data, error } = await this.client
        .from('house_achievements')
        .select('*')
        .eq('userId', userId)
        .order('awardedAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo logros de usuario', error);
      throw error;
    }
  }

  // ========== ALLIANCES ==========

  // Create alliance
  async createAlliance(house1Id, house2Id, duration) {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

      const { data, error } = await this.client
        .from('house_alliances')
        .insert([{
          house1Id,
          house2Id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          active: true
        }])
        .select()
        .single();

      if (error) throw error;
      log.database('ALIANZA CREADA', `Casa ${house1Id} + Casa ${house2Id}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error creando alianza', error);
      throw error;
    }
  }

  // Get active alliances for house
  async getHouseAlliances(houseId) {
    try {
      const { data, error } = await this.client
        .from('house_alliances')
        .select('*, house1:houses!house1Id(*), house2:houses!house2Id(*)')
        .or(`house1Id.eq.${houseId},house2Id.eq.${houseId}`)
        .eq('active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo alianzas', error);
      throw error;
    }
  }

  // ========== MENTORSHIP ==========

  // Register as mentor
  async registerMentor(userId, houseId, availability, curso) {
    try {
      const { data, error } = await this.client
        .from('mentors')
        .upsert([{
          mentorId: userId,
          houseId,
          availability,
          curso,
          certified: false
        }])
        .select()
        .single();

      if (error) throw error;
      log.database('MENTOR REGISTRADO', `Usuario ${userId}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error registrando mentor', error);
      throw error;
    }
  }

  // Get available mentors
  async getAvailableMentors(houseId) {
    try {
      const { data, error } = await this.client
        .from('mentors')
        .select('*, house_members(username)')
        .eq('houseId', houseId)
        .order('mentorId', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo mentores', error);
      throw error;
    }
  }

  // Certify mentor
  async certifyMentor(mentorId, certified = true) {
    try {
      const { data, error } = await this.client
        .from('mentors')
        .update({ certified })
        .eq('mentorId', mentorId)
        .select()
        .single();

      if (error) throw error;
      log.database('MENTOR CERTIFICADO', `Usuario ${mentorId}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error certificando mentor', error);
      throw error;
    }
  }

  // ========== HOUSE HISTORY ==========

  // Add entry to house history
  async addHouseHistory(houseId, eventType, description) {
    try {
      const { data, error } = await this.client
        .from('house_history')
        .insert([{
          houseId,
          eventType,
          description,
          date: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      log.database('HISTORIA CASA', `${eventType}: ${description}`);
      return data;
    } catch (error) {
      log.error('HOUSES', 'Error añadiendo a historia de casa', error);
      throw error;
    }
  }

  // Get house history
  async getHouseHistory(houseId, limit = 50) {
    try {
      const { data, error } = await this.client
        .from('house_history')
        .select('*')
        .eq('houseId', houseId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('HOUSES', 'Error obteniendo historia de casa', error);
      throw error;
    }
  }
}

module.exports = new HousesService();
