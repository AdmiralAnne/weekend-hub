export function initTodo() {
    const taskInput = document.getElementById('new-task');
    const taskList = document.getElementById('task-list');

    // Load from LocalStorage
    let tasks = JSON.parse(localStorage.getItem('study_tasks')) || [];

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task ${task.completed ? 'completed' : ''}`;
            
            const textSpan = document.createElement('span');
            textSpan.textContent = `> ${task.text}`;
            textSpan.addEventListener('click', () => toggleTask(index));

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = '[X]';
            delBtn.addEventListener('click', () => deleteTask(index));

            li.appendChild(textSpan);
            li.appendChild(delBtn);
            taskList.appendChild(li);
        });
        localStorage.setItem('study_tasks', JSON.stringify(tasks));
    }

    function toggleTask(index) {
        tasks[index].completed = !tasks[index].completed;
        renderTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        renderTasks();
    }

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && taskInput.value.trim() !== '') {
            tasks.push({ text: taskInput.value.trim(), completed: false });
            taskInput.value = '';
            renderTasks();
        }
    });

    renderTasks();
}