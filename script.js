document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5272'; 

    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const taskList = document.getElementById('taskList');
    const syncModeSelect = document.getElementById('syncMode');
    const logOutput = document.getElementById('logOutput');

    let pollIntervalId = null;
    let longPollController = new AbortController();
    let signalRConnection = null;

    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(taskText => {
            const li = document.createElement('li');
            li.textContent = taskText;
            taskList.appendChild(li);
        });
    }

    function log(message) {
        logOutput.textContent = `${new Date().toLocaleTimeString()}: ${message}\n${logOutput.textContent}`;
        console.log(message);
    }

    async function addTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        log(`Відправка нового завдання: ${taskText}`);
        try {
            await fetch(`${API_BASE_URL}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskText)
            });
            taskInput.value = '';
            taskInput.focus();
        } catch (error) {
            log(`Помилка додавання: ${error.message}`);
        }
    }

    function stopAllSync() {
        if (pollIntervalId) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
            log('Зупинено: Frequent Poll');
        }
        
        longPollController.abort(); 
        longPollController = new AbortController(); 
        log('Зупинено: Long Poll');

        if (signalRConnection) {
            signalRConnection.stop();
            signalRConnection = null;
            log('Зупинено: Web Sockets');
        }
    }

    function startSync(mode) {
        stopAllSync();
        taskList.innerHTML = ''; 
        log(`Запуск режиму: ${mode}`);

        switch (mode) {
            case 'poll':
                startFrequentPoll();
                break;
            case 'longpoll':
                startLongPoll();
                break;
            case 'websocket':
                startWebSockets();
                break;
            case 'none':
            default:
                break;
        }
    }

    // --- Логіка трьох режимів ---

    // FREQUENT POLL
    async function startFrequentPoll() {
        const fetchTasks = async () => {
            try {
                log('Frequent Poll: Запит...');
                const response = await fetch(`${API_BASE_URL}/api/tasks`);
                const tasks = await response.json();
                renderTasks(tasks);
                log(`Frequent Poll: Отримано ${tasks.length} завдань.`);
            } catch (error) {
                log(`Frequent Poll: Помилка: ${error.message}`);
            }
        };

        fetchTasks(); // Негайний перший запит
        pollIntervalId = setInterval(fetchTasks, 2000); // Потім кожні 2 сек
    }

    // LONG POLL
    async function startLongPoll() {
        try {
            log('Long Poll: Отримання початкового списку...');
            const response = await fetch(`${API_BASE_URL}/api/tasks`);
            const tasks = await response.json();
            renderTasks(tasks);
            log(`Long Poll: Початковий список отримано (${tasks.length} завдань).`);
        } catch (e) {
            log(`Long Poll: Помилка початкового запиту: ${e.message}`);
        }

        (async function pollLoop() {
            log('Long Poll: Відправка "підвішеного" запиту...');
            try {
                const response = await fetch(`${API_BASE_URL}/api/tasks/longpoll`, {
                    signal: longPollController.signal 
                });
                const tasks = await response.json();
                renderTasks(tasks);
                log(`Long Poll: Отримано оновлення! (${tasks.length} завдань).`);
                
                pollLoop(); 
            } catch (error) {
                if (error.name === 'AbortError') {
                    log('Long Poll: Запит зупинено (перемикання режиму).');
                } else {
                    log(`Long Poll: Помилка з'єднання: ${error.message}. Спроба за 5 сек.`);
                    setTimeout(pollLoop, 5000);
                }
            }
        })();
    }
    // WEB SOCKETS
    async function startWebSockets() {
        signalRConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/taskhub`)
            .build();

        signalRConnection.on("TasksUpdated", (tasks) => {
            log(`Web Sockets: Отримано оновлення! (${tasks.length} завдань).`);
            renderTasks(tasks);
        });

        try {
            await signalRConnection.start();
            log('Web Sockets: З\'єднання встановлено.');
            log('Web Sockets: Запит початкового списку...');
            const response = await fetch(`${API_BASE_URL}/api/tasks`);
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            log(`Web Sockets: Помилка підключення: ${error.message}`);
        }
    }

    addButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
    syncModeSelect.addEventListener('change', (e) => startSync(e.target.value));

    log('Додаток готовий. Оберіть режим синхронізації.');
});