module.exports.datastores = {
  default: {
    adapter: 'sails-postgresql',
    url: process.env.DATABASE_URL,
  },
};
