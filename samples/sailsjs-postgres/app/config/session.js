module.exports.session = {
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  secret: process.env.SESSION_SECRET
};
