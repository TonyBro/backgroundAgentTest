/**
 * Cursor Background Agent - PingPong System
 * Система с двумя виртуальными агентами и PingPong коммуникацией
 */

class Agent {
    constructor(id, system) {
        this.id = id;
        this.system = system;
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${this.id}] ${message}`);
    }

    sendMessage(targetAgent, type, data) {
        this.log(`📤 Отправляю ${type}: "${data}" → ${targetAgent}`);
        this.system.deliverMessage(this.id, targetAgent, type, data);
    }

    receiveMessage(fromAgent, type, data) {
        this.log(`📨 Получено ${type}: "${data}" ← ${fromAgent}`);
        
        switch (type) {
            case 'handshake_init':
                this.handleHandshake(fromAgent, data);
                break;
            case 'ping':
                this.handlePing(fromAgent, data);
                break;
            case 'pong':
                this.handlePong(fromAgent, data);
                break;
        }
    }

    handleHandshake(fromAgent, data) {
        this.log(`🤝 Получен хэндшейк от ${fromAgent}: "${data}"`);
        this.sendMessage(fromAgent, 'handshake_response', 'Привет!');
    }

    handlePing(fromAgent, data) {
        this.log(`🏓 Получен PING: "${data}"`);
        this.sendMessage(fromAgent, 'pong', 'PONG! 🏓');
    }

    handlePong(fromAgent, data) {
        this.log(`🏓 Получен PONG: "${data}"`);
    }
}

class CursorBackgroundAgent {
    constructor() {
        this.startTime = new Date();
        this.isRunning = false;
        this.agents = {};
        this.pingPongInterval = null;
        this.pingCount = 0;
        this.pongCount = 0;
        
        // Создаем двух агентов
        this.agents['Agent1'] = new Agent('Agent1', this);
        this.agents['Agent2'] = new Agent('Agent2', this);
        
        this.currentPingAgent = 'Agent1';
        this.currentPongAgent = 'Agent2';
    }

    start() {
        if (this.isRunning) {
            this.log('🔄 Система уже запущена');
            return;
        }

        this.isRunning = true;
        this.log('🚀 Система PingPong запущена');
        this.log(`🔧 PID: ${process.pid}`);
        this.log(`📋 Agent1 Session: ${this.agents['Agent1'].sessionId}`);
        this.log(`📋 Agent2 Session: ${this.agents['Agent2'].sessionId}`);

        // Запускаем хэндшейк
        this.initiateHandshake();

        // Обработка сигналов для корректного завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        process.on('SIGUSR1', () => this.showStatus());
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [SYSTEM] ${message}`);
    }

    deliverMessage(fromAgent, toAgent, type, data) {
        // Симулируем небольшую задержку для реалистичности
        setTimeout(() => {
            if (this.agents[toAgent]) {
                this.agents[toAgent].receiveMessage(fromAgent, type, data);
                
                // Если это ответ на хэндшейк, запускаем PingPong
                if (type === 'handshake_response') {
                    this.log('✅ Хэндшейк завершен! Запускаю PingPong команду');
                    this.startPingPong();
                }
                
                // Счетчики для статистики
                if (type === 'ping') this.pingCount++;
                if (type === 'pong') this.pongCount++;
            }
        }, 10); // Небольшая задержка в 10мс
    }

    initiateHandshake() {
        this.log('🤝 Инициирую хэндшейк между агентами');
        this.agents['Agent1'].sendMessage('Agent2', 'handshake_init', 'Привет!');
    }

    startPingPong() {
        this.log('🏓 Команда PingPong запущена (интервал: 1 секунда)');
        
        this.pingPongInterval = setInterval(() => {
            this.executePingPongCommand();
        }, 1000);
    }

    executePingPongCommand() {
        if (!this.isRunning) return;

        // Agent1 отправляет ping Agent2
        const pingData = `PING! 🏓 (#${this.pingCount + 1})`;
        this.agents[this.currentPingAgent].sendMessage(this.currentPongAgent, 'ping', pingData);
    }

    showStatus() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log('=== STATUS REPORT ===');
        this.log(`Статус системы: ${this.isRunning ? 'Активна' : 'Остановлена'}`);
        this.log(`Время работы: ${uptime} секунд`);
        this.log(`Количество агентов: ${Object.keys(this.agents).length}`);
        this.log(`Пингов отправлено: ${this.pingCount}`);
        this.log(`Понгов получено: ${this.pongCount}`);
        this.log(`Agent1 Session: ${this.agents['Agent1'].sessionId}`);
        this.log(`Agent2 Session: ${this.agents['Agent2'].sessionId}`);
        this.log('=== END STATUS ===');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\n🛑 Остановка системы PingPong...');
        this.isRunning = false;
        
        // Останавливаем PingPong
        if (this.pingPongInterval) {
            clearInterval(this.pingPongInterval);
            this.pingPongInterval = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Система PingPong остановлена. Время работы: ${uptime}с`);
        this.log(`📊 Статистика: Пингов: ${this.pingCount}, Понгов: ${this.pongCount}`);
        
        process.exit(0);
    }

    // Метод для получения метрик
    getMetrics() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            isRunning: this.isRunning,
            uptime: uptime,
            agentCount: Object.keys(this.agents).length,
            pingCount: this.pingCount,
            pongCount: this.pongCount,
            agents: Object.keys(this.agents).map(id => ({
                id: id,
                sessionId: this.agents[id].sessionId
            }))
        };
    }
}

// Создание и запуск системы
const system = new CursorBackgroundAgent();

// Запускаем систему
system.start();

// Экспортируем для возможного использования
module.exports = CursorBackgroundAgent; 