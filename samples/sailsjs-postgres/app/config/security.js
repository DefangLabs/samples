module.exports.security = {
  cors: {
    allRoutes: true,
    allowOrigins: [
      'http://localhost:1337', // Add the appropriate origins here
    ],
    allowCredentials: true,
  }
};
