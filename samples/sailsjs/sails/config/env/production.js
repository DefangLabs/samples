module.exports = {
  sockets: {
    // Allow only specified origins to connect
    onlyAllowOrigins: process.env.SOCKETS_ALLOW_ORIGINS ? process.env.SOCKETS_ALLOW_ORIGINS.split(',') : []
  },
  session: {
    cookie: {
      secure: process.env.SESSION_COOKIE_SECURE === 'true'
    }
  },
  http: {
    trustProxy: process.env.HTTP_TRUST_PROXY === 'true'
  }
};
