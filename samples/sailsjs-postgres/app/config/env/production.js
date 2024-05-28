module.exports = {
  port: 1337,

  models: {
    datastore: 'default',
    migrate: 'safe'
  },

  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: true
    }
  },

  sockets: {
    onlyAllowOrigins: [
      'http://localhost:1337',
    ]
  },

  security: {
    cors: {
      allRoutes: true,
      allowOrigins: [
        'http://localhost:1337',
      ],
      allowCredentials: true,
    }
  },

  datastores: {
    default: {
      adapter: 'sails-postgresql',
      url: process.env.DATABASE_URL,
      ssl: true
    }
  },

  http: {
    trustProxy: true
  }
};
