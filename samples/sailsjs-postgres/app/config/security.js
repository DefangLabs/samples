module.exports.security = {
  cors: {
    allRoutes: true,
    allowOrigins: [
      'http://localhost:1337', // Development origin
      'https://chrisyhjiang-app--1337.prod1.defang.dev', // Production origin
    ],
    allowCredentials: true,
  }
};
