document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const taskList = document.getElementById('taskList');

    const tasksRef = database.ref('tasks');

    let tasks = [];

    tasksRef.on('value', (snapshot) => {
        const data = snapshot.val();
        tasks = data ? data : [];
        renderTasks();
    });

    function saveTasksToFirebase() {
        tasksRef.set(tasks);
    }

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
        if (taskText === '') return;

        tasks.push(taskText);
        saveTasksToFirebase(); 
        
        
        taskInput.value = '';
        taskInput.focus();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasksToFirebase(); 
        
    }

    addButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') addTask();
    });

    new Sortable(taskList, {
        animation: 150,
        ghostClass: 'task-ghost',
        
        onEnd: (evt) => {
            const [movedItem] = tasks.splice(evt.oldIndex, 1);
            tasks.splice(evt.newIndex, 0, movedItem);

            saveTasksToFirebase();
        }
    });
});