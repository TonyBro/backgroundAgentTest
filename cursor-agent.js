/**
 * Cursor Background Agent - VLOG Logger
 * Оптимизированная версия для работы в удаленной среде Cursor
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
            this.log('VLOG: Cursor Background Agent уже запущен');
            return;
        }

        this.isRunning = true;
        this.log('VLOG: 🚀 Cursor Background Agent запущен в удаленной среде');
        this.log(`VLOG: Session ID: ${this.sessionId}`);
        this.log('VLOG: привет из бэкграунда');

        // Логируем информацию о среде
        this.logEnvironmentInfo();

        this.intervalId = setInterval(() => {
            this.logMessage();
        }, this.interval);

        // Обработка сигналов для корректного завершения
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
        const formattedTime = currentTime.toLocaleTimeString('ru-RU');
        
        this.log(`VLOG: привет из бэкграунда [${formattedTime}, Время работы: ${uptime}с, Сообщений: ${this.messageCount}]`);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    showStatus() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log('VLOG: === STATUS REPORT ===');
        this.log(`VLOG: Статус: ${this.isRunning ? 'Активен' : 'Остановлен'}`);
        this.log(`VLOG: Время работы: ${uptime} секунд`);
        this.log(`VLOG: Интервал: ${this.interval}мс`);
        this.log(`VLOG: Сообщений отправлено: ${this.messageCount}`);
        this.log(`VLOG: Session ID: ${this.sessionId}`);
        this.log('VLOG: === END STATUS ===');
    }

    changeInterval() {
        const newInterval = this.interval === 3000 ? 1000 : 3000;
        this.log(`VLOG: 🔄 Изменяю интервал с ${this.interval}мс на ${newInterval}мс`);
        this.setInterval(newInterval);
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\nVLOG: 🛑 Остановка Cursor Background Agent...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`VLOG: ✅ Cursor Background Agent остановлен. Время работы: ${uptime}с, Сообщений: ${this.messageCount}`);
        process.exit(0);
    }

    setInterval(newInterval) {
        if (newInterval < 500) {
            this.log('VLOG: ⚠️ Минимальный интервал: 500мс');
            return;
        }

        this.interval = newInterval;
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => {
                this.logMessage();
            }, this.interval);
            this.log(`VLOG: 🔄 Интервал изменен на ${this.interval}мс`);
        }
    }

    // Метод для получения метрик
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

// Создание и запуск агента
const agent = new CursorBackgroundAgent(3000);

// Проверяем переменные окружения для настройки
const envInterval = process.env.AGENT_INTERVAL;
if (envInterval && !isNaN(envInterval)) {
    agent.setInterval(parseInt(envInterval));
}

// Запускаем агент
agent.start();

// Экспортируем для возможного использования
module.exports = CursorBackgroundAgent; 