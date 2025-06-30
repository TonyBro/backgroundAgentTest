const { Worker, isMainThread, parentPort } = require('worker_threads');
const path = require('path');

class BackgroundAgentManager {
    constructor(interval = 3000) {
        this.interval = interval;
        this.worker = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('VLOG: Менеджер агента уже запущен');
            return;
        }

        console.log('VLOG: Запуск фонового агента в отдельном потоке...');
        
        // Создаем worker thread
        this.worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData: { interval: this.interval }
        });

        // Обработка сообщений от worker
        this.worker.on('message', (data) => {
            if (data.type === 'log') {
                console.log(data.message);
            }
        });

        // Обработка ошибок worker
        this.worker.on('error', (error) => {
            console.error('VLOG: Ошибка в worker thread:', error);
        });

        // Обработка завершения worker
        this.worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`VLOG: Worker остановлен с кодом ${code}`);
            }
            this.isRunning = false;
        });

        this.isRunning = true;

        // Обработка сигналов для корректного завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    stop() {
        if (!this.isRunning || !this.worker) {
            console.log('VLOG: Агент не запущен');
            return;
        }

        console.log('\nVLOG: Остановка фонового агента...');
        
        // Отправляем команду остановки worker
        this.worker.postMessage({ command: 'stop' });
        
        // Завершаем worker thread
        setTimeout(() => {
            this.worker.terminate();
            this.isRunning = false;
            console.log('VLOG: Фоновый агент остановлен');
            process.exit(0);
        }, 1000);
    }

    setInterval(newInterval) {
        this.interval = newInterval;
        if (this.isRunning && this.worker) {
            this.worker.postMessage({ 
                command: 'setInterval', 
                interval: newInterval 
            });
        }
    }

    // Метод для отправки команд worker
    sendCommand(command, data = {}) {
        if (this.isRunning && this.worker) {
            this.worker.postMessage({ command, ...data });
        }
    }

    // Получение статуса
    getStatus() {
        return {
            isRunning: this.isRunning,
            interval: this.interval,
            workerExists: !!this.worker
        };
    }
}

// Проверяем, что это основной поток
if (isMainThread) {
    // Создание и запуск менеджера агента
    const agentManager = new BackgroundAgentManager(3000); // Сообщение каждые 3 секунды
    agentManager.start();

    // Экспортируем класс для возможного использования в других модулях
    module.exports = BackgroundAgentManager;
} else {
    // Этот код не должен выполняться, так как worker находится в отдельном файле
    console.log('VLOG: Ошибка - попытка запуска в worker thread');
} 