const { sql } = require('../config/db');

async function deleteExpiredRefreshTokens(pool) {
  try {
    await pool.request().query(`DELETE FROM RefreshTokens WHERE expires_at < GETDATE()`);
  } catch (err) {
    console.warn('Failed to delete expired refresh tokens:', err.message || err);
  }
}

function scheduleRefreshTokenCleanup(connectDB, intervalMs = 24 * 60 * 60 * 1000) {
  // Run once immediately, then on interval (default: daily)
  (async () => {
    try {
      const pool = await connectDB();
      await deleteExpiredRefreshTokens(pool);
    } catch (e) {
      console.warn('Refresh token cleanup initial run failed:', e.message || e);
    }
  })();

  setInterval(async () => {
    try {
      const pool = await connectDB();
      await deleteExpiredRefreshTokens(pool);
    } catch (e) {
      console.warn('Refresh token cleanup failed:', e.message || e);
    }
  }, intervalMs);
}

module.exports = { scheduleRefreshTokenCleanup, deleteExpiredRefreshTokens };
