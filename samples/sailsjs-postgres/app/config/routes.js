module.exports.routes = {
  '/': 'TaskController.index',
  'POST /tasks': 'TaskController.create',
  'DELETE /tasks/:id': 'TaskController.destroy'
};
