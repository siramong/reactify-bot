const supabaseService = require('../services/supabase');

// Ensure user exists in database
async function ensureUserExists(userId, username) {
  try {
    return await supabaseService.ensureUser(userId, username);
  } catch (error) {
    console.error('Error in ensureUserExists:', error);
    throw error;
  }
}

// Get user with error handling
async function getUser(userId) {
  try {
    return await supabaseService.getUser(userId);
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}

// Update user curso
async function updateUserCurso(userId, curso) {
  try {
    return await supabaseService.updateUserCurso(userId, curso);
  } catch (error) {
    console.error('Error in updateUserCurso:', error);
    throw error;
  }
}

module.exports = {
  ensureUserExists,
  getUser,
  updateUserCurso
};
