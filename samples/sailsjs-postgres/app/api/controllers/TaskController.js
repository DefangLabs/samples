module.exports = {
  index: async function (req, res) {
    try {
      const tasks = await Task.find();
      return res.view('pages/homepage', { tasks: tasks });
    } catch (err) {
      return res.serverError(err);
    }
  },

  create: async function (req, res) {
    try {
      const newTask = await Task.create(req.body).fetch();
      return res.status(201).json(newTask);
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
  },

  destroy: async function (req, res) {
    try {
      const taskId = req.params.id;
      await Task.destroyOne({ id: taskId });
      return res.ok();
    } catch (err) {
      return res.serverError(err);
    }
  }
};
