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
            this.sendMessage('VLOG: Worker is already running');
            return;
        }

        this.isRunning = true;
        this.sendMessage('VLOG: Background worker started in separate thread');
        this.sendMessage('VLOG: hello from background');

        this.intervalId = setInterval(() => {
            this.logMessage();
        }, this.interval);
    }

    logMessage() {
        const currentTime = new Date();
        const uptime = Math.floor((currentTime - this.startTime) / 1000);
        
        this.sendMessage(`VLOG: hello from background [Worker ID: ${process.pid}, Uptime: ${uptime}s]`);
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

        this.sendMessage('VLOG: Stopping background worker...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.sendMessage('VLOG: Background worker stopped');
    }

    setInterval(newInterval) {
        this.interval = newInterval;
        if (this.isRunning) {
            this.stop();
            setTimeout(() => this.start(), 100);
        }
    }
}

// Get settings from main thread
const interval = workerData?.interval || 3000;
const worker = new BackgroundWorker(interval);

// Handle messages from main thread
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

// Auto start
worker.start(); 