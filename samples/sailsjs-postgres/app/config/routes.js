module.exports.routes = {
  '/': 'TaskController.index',
  'POST /task': 'TaskController.create',
  'PUT /task/:id': 'TaskController.update',
  'DELETE /task/:id': 'TaskController.destroy',
};
