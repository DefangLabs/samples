'use strict';

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM fully loaded and parsed'); // Debug log

  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  let isSubmitting = false;

  console.log('Adding submit event listener'); // Debug log

  // Check if the listener has already been added
  if (!taskForm.hasAttribute('listenerAdded')) {
    taskForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      console.log('Form submission prevented'); // Debug log
      if (isSubmitting) {
        console.log('Submission is already in progress, aborting'); // Debug log
        return; // Prevent multiple submissions
      }
      isSubmitting = true;

      const taskTitle = taskInput.value.trim();
      if (taskTitle) {
        console.log('Task title:', taskTitle); // Debug log
        try {
          const response = await fetch('/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: taskTitle })
          });
          console.log('Response received:', response); // Debug log
          if (response.ok) {
            const task = await response.json();
            console.log('Task added:', task); // Debug log
            addTaskToList(task);
            taskInput.value = '';
          } else {
            const error = await response.json();
            console.error('Error adding task:', error.details);
          }
        } catch (error) {
          console.error('Error adding task:', error);
        } finally {
          isSubmitting = false; // Reset the flag after submission is handled
        }
      } else {
        isSubmitting = false; // Reset the flag if taskTitle is empty
      }
    });

    taskForm.setAttribute('listenerAdded', 'true'); // Mark the form to prevent duplicate listeners
  }

  taskList.addEventListener('click', async function (e) {
    if (e.target.classList.contains('delete-button')) {
      const li = e.target.parentElement;
      const taskId = li.getAttribute('data-id');
      console.log('Deleting task with ID:', taskId); // Debug log
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
    console.log('addTaskToList called with task:', task); // Debug log
    const noTasksMessage = document.getElementById('noTasksMessage');
    if (noTasksMessage) {
      noTasksMessage.remove(); // Remove the "No tasks found" message if it exists
    }

    const li = document.createElement('li');
    li.setAttribute('data-id', task.id);
    li.innerHTML = `
      <span>${task.title}</span>
      <button class="delete-button">Delete</button>
    `;
    taskList.appendChild(li);
    console.log('Task appended to list:', task); // Debug log
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
