module.exports = {
  port: 1337,

  models: {
    datastore: 'default',
    migrate: 'alter'
  },

  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: false
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
      ssl: false
    }
  },

  http: {
    trustProxy: false
  }
};
