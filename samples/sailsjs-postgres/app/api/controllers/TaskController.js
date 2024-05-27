module.exports = {
  // Fetch all tasks and render the homepage
  async index(req, res) {
    try {
      const tasks = await Task.find(); // Fetch tasks from the database
      return res.view('pages/homepage', { tasks }); // Pass tasks to the view
    } catch (err) {
      return res.serverError(err);
    }
  },

  // Create a new task
  async create(req, res) {
    try {
      const task = await Task.create(req.body).fetch();
      return res.json(task);
    } catch (err) {
      return res.serverError(err);
    }
  },

  // Delete a task
  async destroy(req, res) {
    try {
      const taskId = req.params.id;
      await Task.destroyOne({ id: taskId });
      return res.ok();
    } catch (err) {
      return res.serverError(err);
    }
  }
};
