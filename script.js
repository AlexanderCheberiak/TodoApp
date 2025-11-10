document.addEventListener('DOMContentLoaded', () => {

    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const taskList = document.getElementById('taskList');

    const STORAGE_KEY = 'todoTasks';

    function loadTasks() {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        return savedTasks ? JSON.parse(savedTasks) : [];
    }

    function saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    let tasks = loadTasks();

    function renderTasks() {
        taskList.innerHTML = '';

        tasks.forEach((taskText, index) => {
            const li = document.createElement('li');
            
            const taskSpan = document.createElement('span');
            taskSpan.textContent = taskText;
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Видалити';
            deleteButton.className = 'delete-btn';
            
            deleteButton.onclick = () => {
                deleteTask(index);
            };

            li.appendChild(taskSpan);
            li.appendChild(deleteButton);
            taskList.appendChild(li);
        });
    }

    function addTask() {
        const taskText = taskInput.value.trim(); 

        if (taskText === '') {
            alert('Будь ласка, введіть завдання.');
            return; 
        }

        tasks.push(taskText);
        
        saveTasks();
        
        renderTasks();
        
        taskInput.value = '';
        taskInput.focus();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        
        saveTasks();
        
        renderTasks();
    }

    addButton.addEventListener('click', addTask);
    
    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    renderTasks();

    new Sortable(taskList, {
        animation: 150, 
        ghostClass: 'task-ghost', 

        onEnd: () => {
            
            const updatedTasks = [];
            
            taskList.querySelectorAll('li span').forEach(span => {
                updatedTasks.push(span.textContent);
            });

            tasks = updatedTasks;
            
            saveTasks();
            renderTasks();
        }
    });
});