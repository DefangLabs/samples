document.addEventListener('DOMContentLoaded', function () {
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  let isSubmitting = false;

  taskForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    const taskTitle = taskInput.value.trim();
    if (taskTitle) {
      try {
        const response = await fetch('/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: taskTitle })
        });

        if (response.ok) {
          const task = await response.json();
          addTaskToList(task);
          taskInput.value = '';
        } else {
          const error = await response.json();
          console.error('Error adding task:', error.details);
        }
      } catch (error) {
        console.error('Error adding task:', error);
      } finally {
        isSubmitting = false;
      }
    } else {
      isSubmitting = false;
    }
  });

  taskList.addEventListener('click', async function (e) {
    if (e.target.classList.contains('delete-button')) {
      const li = e.target.parentElement;
      const taskId = li.getAttribute('data-id');
      try {
        const response = await fetch(`/tasks/${taskId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          li.remove();
          checkIfNoTasks();
        } else {
          console.error('Failed to delete task:', response.statusText);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  });

  function addTaskToList(task) {
    const noTasksMessage = document.getElementById('noTasksMessage');
    if (noTasksMessage) {
      noTasksMessage.remove();
    }

    const li = document.createElement('li');
    li.setAttribute('data-id', task.id);
    li.innerHTML = `
      <span>${task.title}</span>
      <button class="delete-button">Delete</button>
    `;
    taskList.appendChild(li);
  }

  function checkIfNoTasks() {
    if (!taskList.querySelector('li')) {
      const noTasksMessage = document.createElement('li');
      noTasksMessage.id = 'noTasksMessage';
      noTasksMessage.textContent = 'No tasks found';
      taskList.appendChild(noTasksMessage);
    }
  }
});
