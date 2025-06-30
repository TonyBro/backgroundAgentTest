/**
 * Cursor Background Agent - VLOG Logger
 * Optimized version for remote Cursor environment
 */

class CursorBackgroundAgent {
    constructor(interval = 3000) {
        this.interval = interval;
        this.isRunning = false;
        this.intervalId = null;
        this.startTime = new Date();
        this.messageCount = 0;
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    start() {
        if (this.isRunning) {
            this.log('VLOG: Cursor Background Agent is already running');
            return;
        }

        this.isRunning = true;
        this.log('VLOG: 🚀 Cursor Background Agent started in remote environment');
        this.log(`VLOG: Session ID: ${this.sessionId}`);
        this.log('VLOG: hello from background');

        // Log environment information
        this.logEnvironmentInfo();

        this.intervalId = setInterval(() => {
            this.logMessage();
        }, this.interval);

        // Handle signals for graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        process.on('SIGUSR1', () => this.showStatus());
        process.on('SIGUSR2', () => this.changeInterval());
    }

    logEnvironmentInfo() {
        this.log(`VLOG: 🖥️  Hostname: ${require('os').hostname()}`);
        this.log(`VLOG: 🐧 Platform: ${process.platform} ${process.arch}`);
        this.log(`VLOG: 📁 Working Dir: ${process.cwd()}`);
        this.log(`VLOG: 🟢 Node.js: ${process.version}`);
        this.log(`VLOG: 🔧 PID: ${process.pid}`);
    }

    logMessage() {
        this.messageCount++;
        const currentTime = new Date();
        const uptime = Math.floor((currentTime - this.startTime) / 1000);
        const formattedTime = currentTime.toLocaleTimeString('en-US');
        
        this.log(`VLOG: hello from background [${formattedTime}, Uptime: ${uptime}s, Messages: ${this.messageCount}]`);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    showStatus() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log('VLOG: === STATUS REPORT ===');
        this.log(`VLOG: Status: ${this.isRunning ? 'Active' : 'Stopped'}`);
        this.log(`VLOG: Uptime: ${uptime} seconds`);
        this.log(`VLOG: Interval: ${this.interval}ms`);
        this.log(`VLOG: Messages sent: ${this.messageCount}`);
        this.log(`VLOG: Session ID: ${this.sessionId}`);
        this.log('VLOG: === END STATUS ===');
    }

    changeInterval() {
        const newInterval = this.interval === 3000 ? 1000 : 3000;
        this.log(`VLOG: 🔄 Changing interval from ${this.interval}ms to ${newInterval}ms`);
        this.setInterval(newInterval);
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\nVLOG: 🛑 Stopping Cursor Background Agent...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`VLOG: ✅ Cursor Background Agent stopped. Uptime: ${uptime}s, Messages: ${this.messageCount}`);
        process.exit(0);
    }

    setInterval(newInterval) {
        if (newInterval < 500) {
            this.log('VLOG: ⚠️ Minimum interval: 500ms');
            return;
        }

        this.interval = newInterval;
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => {
                this.logMessage();
            }, this.interval);
            this.log(`VLOG: 🔄 Interval changed to ${this.interval}ms`);
        }
    }

    // Method to get metrics
    getMetrics() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            isRunning: this.isRunning,
            sessionId: this.sessionId,
            uptime: uptime,
            messageCount: this.messageCount,
            interval: this.interval,
            averageMessagesPerSecond: uptime > 0 ? (this.messageCount / uptime).toFixed(2) : 0
        };
    }
}

// Create and start agent
const agent = new CursorBackgroundAgent(3000);

// Check environment variables for configuration
const envInterval = process.env.AGENT_INTERVAL;
if (envInterval && !isNaN(envInterval)) {
    agent.setInterval(parseInt(envInterval));
}

// Start agent
agent.start();

// Export for possible use
module.exports = CursorBackgroundAgent; 