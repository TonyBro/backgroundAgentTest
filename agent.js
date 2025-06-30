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
            console.log('VLOG: Agent manager is already running');
            return;
        }

        console.log('VLOG: Starting background agent in separate thread...');
        
        // Create worker thread
        this.worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData: { interval: this.interval }
        });

        // Handle messages from worker
        this.worker.on('message', (data) => {
            if (data.type === 'log') {
                console.log(data.message);
            }
        });

        // Handle worker errors
        this.worker.on('error', (error) => {
            console.error('VLOG: Error in worker thread:', error);
        });

        // Handle worker exit
        this.worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`VLOG: Worker stopped with code ${code}`);
            }
            this.isRunning = false;
        });

        this.isRunning = true;

        // Handle signals for graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    stop() {
        if (!this.isRunning || !this.worker) {
            console.log('VLOG: Agent is not running');
            return;
        }

        console.log('\nVLOG: Stopping background agent...');
        
        // Send stop command to worker
        this.worker.postMessage({ command: 'stop' });
        
        // Terminate worker thread
        setTimeout(() => {
            this.worker.terminate();
            this.isRunning = false;
            console.log('VLOG: Background agent stopped');
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

    // Method to send commands to worker
    sendCommand(command, data = {}) {
        if (this.isRunning && this.worker) {
            this.worker.postMessage({ command, ...data });
        }
    }

    // Get status
    getStatus() {
        return {
            isRunning: this.isRunning,
            interval: this.interval,
            workerExists: !!this.worker
        };
    }
}

// Check if this is the main thread
if (isMainThread) {
    // Create and start agent manager
    const agentManager = new BackgroundAgentManager(3000); // Message every 3 seconds
    agentManager.start();

    // Export class for possible use in other modules
    module.exports = BackgroundAgentManager;
} else {
    // This code should not execute since worker is in a separate file
    console.log('VLOG: Error - attempt to run in worker thread');
} 