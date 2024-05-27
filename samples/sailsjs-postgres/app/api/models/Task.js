module.exports = {
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
    },
    title: {
      type: 'string',
      required: true,
    },
    completed: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
  primaryKey: 'id',
};
