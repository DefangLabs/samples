// api/models/Task.js
module.exports = {
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      unique: true,
    },
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      allowNull: true,
    },
    completed: {
      type: 'boolean',
      defaultsTo: false,
    },
    createdAt: {
      type: 'ref',
      columnType: 'timestamp',
      autoCreatedAt: true,
    },
    updatedAt: {
      type: 'ref',
      columnType: 'timestamp',
      autoUpdatedAt: true,
    },
  },

  beforeCreate: function (values, cb) {
    values.createdAt = new Date();
    values.updatedAt = new Date();
    return cb();
  },

  beforeUpdate: function (values, cb) {
    values.updatedAt = new Date();
    return cb();
  },
};
