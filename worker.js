const { parentPort, workerData } = require('worker_threads');

class BackgroundWorker {
    constructor(interval = 5000) {
        this.interval = interval;
        this.isRunning = false;
        this.intervalId = null;
        this.startTime = new Date();
    }

    start() {
        if (this.isRunning) {
            this.sendMessage('VLOG: Worker уже запущен');
            return;
        }

        this.isRunning = true;
        this.sendMessage('VLOG: Фоновый worker запущен в отдельном потоке');
        this.sendMessage('VLOG: привет из бэкграунда');

        this.intervalId = setInterval(() => {
            this.logMessage();
        }, this.interval);
    }

    logMessage() {
        const currentTime = new Date();
        const uptime = Math.floor((currentTime - this.startTime) / 1000);
        
        this.sendMessage(`VLOG: привет из бэкграунда [Worker ID: ${process.pid}, Время работы: ${uptime}с]`);
    }

    sendMessage(message) {
        if (parentPort) {
            parentPort.postMessage({
                type: 'log',
                message: message,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(message);
        }
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.sendMessage('VLOG: Остановка фонового worker...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.sendMessage('VLOG: Фоновый worker остановлен');
    }

    setInterval(newInterval) {
        this.interval = newInterval;
        if (this.isRunning) {
            this.stop();
            setTimeout(() => this.start(), 100);
        }
    }
}

// Получаем настройки из основного потока
const interval = workerData?.interval || 3000;
const worker = new BackgroundWorker(interval);

// Обработка сообщений от основного потока
if (parentPort) {
    parentPort.on('message', (data) => {
        switch (data.command) {
            case 'start':
                worker.start();
                break;
            case 'stop':
                worker.stop();
                break;
            case 'setInterval':
                worker.setInterval(data.interval);
                break;
        }
    });
}

// Автоматический запуск
worker.start(); 