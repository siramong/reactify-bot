// Simple in-memory store for attachments provided via command options
// Keyed by userId. Not persistent across restarts — acceptable for passing
// data from the command invocation to the modal submit handler.

const map = new Map();

module.exports = {
  set(userId, attachment) {
    map.set(String(userId), attachment);
  },
  getAndDelete(userId) {
    const key = String(userId);
    const val = map.get(key) || null;
    map.delete(key);
    return val;
  },
  // Exposed for tests/debugging
  _peek(userId) {
    return map.get(String(userId));
  }
};
