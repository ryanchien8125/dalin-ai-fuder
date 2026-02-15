
export default defineNitroPlugin((nitroApp) => {
  // Initialize SQLite database on startup
  try {
      initDb();
      console.log('✅ SQLite Database initialized successfully');
  } catch (error) {
      console.error('❌ SQLite Database initialization failed:', error);
  }
});
