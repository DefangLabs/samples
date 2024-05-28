module.exports = {
    models: {
      migrate: 'alter',
    },
    datastores: {
      default: {
        adapter: require('sails-postgresql'),
        url: process.env.DATABASE_URL || 'postgresql://todolist_user:password@localhost:5432/todolist_db',
      },
    },
    log: {
      level: 'debug',
    },
    security: {
      cors: {
        allRoutes: true,
        allowOrigins: ['http://localhost:1337'],  // Allow all origins for development
      },
      csrf: false,  // You might disable CSRF protection in development
    },
  };