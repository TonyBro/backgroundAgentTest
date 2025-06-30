/**
 * Cursor Background Agent - Ping-Pong Communication
 * Система двух агентов с пинг-понг коммуникацией
 */

const { fork } = require('child_process');
const path = require('path');

class CursorBackgroundAgent {
    constructor() {
        this.startTime = new Date();
        this.sessionId = this.generateSessionId();
        this.agentId = 'Agent1';
        this.isRunning = false;
        
        // Для работы с вторичным агентом
        this.secondaryAgent = null;
        this.secondaryAgentReady = false;
        this.handshakeComplete = false;
        this.pingPongInterval = null;
        this.pingCount = 0;
        this.pongCount = 0;
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    start() {
        if (this.isRunning) {
            this.log('🔄 Агент уже запущен');
            return;
        }

        this.isRunning = true;
        this.log('🚀 Основной агент (Agent1) запущен');
        this.log(`📋 Session ID: ${this.sessionId}`);
        this.log(`🔧 PID: ${process.pid}`);

        // Создаем вторичный агент
        this.createSecondaryAgent();

        // Обработка сигналов для корректного завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        process.on('SIGUSR1', () => this.showStatus());
    }

    createSecondaryAgent() {
        this.log('🔄 Создание вторичного агента...');
        
        const secondaryAgentPath = path.join(__dirname, 'cursor-agent-secondary.js');
        
        try {
            this.secondaryAgent = fork(secondaryAgentPath, [], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            });

            this.log(`✅ Вторичный агент создан с PID: ${this.secondaryAgent.pid}`);

            // Обработка сообщений от вторичного агента
            this.secondaryAgent.on('message', (message) => {
                this.handleSecondaryAgentMessage(message);
            });

            // Обработка ошибок и завершения вторичного агента
            this.secondaryAgent.on('error', (error) => {
                this.log(`❌ Ошибка вторичного агента: ${error.message}`);
            });

            this.secondaryAgent.on('exit', (code, signal) => {
                this.log(`🚪 Вторичный агент завершился (code: ${code}, signal: ${signal})`);
                this.secondaryAgentReady = false;
                this.handshakeComplete = false;
                if (this.pingPongInterval) {
                    clearInterval(this.pingPongInterval);
                    this.pingPongInterval = null;
                }
            });

        } catch (error) {
            this.log(`❌ Ошибка создания вторичного агента: ${error.message}`);
        }
    }

    handleSecondaryAgentMessage(message) {
        this.log(`📨 [${this.agentId}] Получено сообщение от ${message.sender}: ${message.type} - "${message.data}"`);

        switch (message.type) {
            case 'ready':
                this.handleSecondaryAgentReady(message);
                break;
            case 'handshake_response':
                this.handleHandshakeResponse(message);
                break;
            case 'pong':
                this.handlePong(message);
                break;
            default:
                this.log(`⚠️ Неизвестный тип сообщения от вторичного агента: ${message.type}`);
        }
    }

    handleSecondaryAgentReady(message) {
        this.log('✅ Вторичный агент готов к работе');
        this.secondaryAgentReady = true;
        
        // Ждем немного и инициируем хэндшейк
        setTimeout(() => {
            this.initiateHandshake();
        }, 500);
    }

    initiateHandshake() {
        if (!this.secondaryAgentReady) {
            this.log('⚠️ Вторичный агент не готов для хэндшейка');
            return;
        }

        this.log('🤝 Инициирую хэндшейк с вторичным агентом');
        
        const handshakeMessage = {
            type: 'handshake_init',
            data: 'Привет!',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.secondaryAgent.send(handshakeMessage);
        this.log(`📤 [${this.agentId}] Отправлен хэндшейк: "${handshakeMessage.data}"`);
    }

    handleHandshakeResponse(message) {
        this.log('🤝 Получен ответ на хэндшейк от вторичного агента');
        this.log(`📥 [${this.agentId}] Вторичный агент ответил: "${message.data}"`);
        
        this.handshakeComplete = true;
        this.log('✅ Хэндшейк завершен! Начинаю пинг-понг коммуникацию');
        
        // Начинаем пинг-понг коммуникацию каждую секунду
        this.startPingPong();
    }

    startPingPong() {
        if (this.pingPongInterval) {
            clearInterval(this.pingPongInterval);
        }

        this.pingPongInterval = setInterval(() => {
            this.sendPing();
        }, 1000); // каждую секунду

        this.log('🏓 Пинг-понг коммуникация запущена (интервал: 1 секунда)');
    }

    sendPing() {
        if (!this.handshakeComplete || !this.secondaryAgent) {
            return;
        }

        this.pingCount++;
        const pingMessage = {
            type: 'ping',
            data: `PING! 🏓 (#${this.pingCount})`,
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.secondaryAgent.send(pingMessage);
        this.log(`🏓 [${this.agentId}] Отправлен PING: "${pingMessage.data}"`);
    }

    handlePong(message) {
        this.pongCount++;
        this.log(`🏓 [${this.agentId}] Получен PONG от ${message.sender}: "${message.data}" (#${this.pongCount})`);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    showStatus() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log('=== STATUS REPORT ===');
        this.log(`[${this.agentId}] Статус: ${this.isRunning ? 'Активен' : 'Остановлен'}`);
        this.log(`Время работы: ${uptime} секунд`);
        this.log(`Session ID: ${this.sessionId}`);
        this.log(`Вторичный агент готов: ${this.secondaryAgentReady}`);
        this.log(`Хэндшейк завершен: ${this.handshakeComplete}`);
        this.log(`Пингов отправлено: ${this.pingCount}`);
        this.log(`Понгов получено: ${this.pongCount}`);
        this.log('=== END STATUS ===');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\n🛑 Остановка системы агентов...');
        this.isRunning = false;
        
        // Останавливаем пинг-понг
        if (this.pingPongInterval) {
            clearInterval(this.pingPongInterval);
            this.pingPongInterval = null;
        }

        // Завершаем вторичный агент
        if (this.secondaryAgent) {
            this.log('🔄 Завершение вторичного агента...');
            this.secondaryAgent.kill('SIGTERM');
            this.secondaryAgent = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Система агентов остановлена. Время работы: ${uptime}с`);
        this.log(`📊 Статистика пинг-понг: Пингов: ${this.pingCount}, Понгов: ${this.pongCount}`);
        
        process.exit(0);
    }

    // Метод для получения метрик
    getMetrics() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            agentId: this.agentId,
            isRunning: this.isRunning,
            sessionId: this.sessionId,
            uptime: uptime,
            secondaryAgent: {
                ready: this.secondaryAgentReady,
                handshakeComplete: this.handshakeComplete,
                pingCount: this.pingCount,
                pongCount: this.pongCount
            }
        };
    }
}

// Создание и запуск агента
const agent = new CursorBackgroundAgent();

// Запускаем агент
agent.start();

// Экспортируем для возможного использования
module.exports = CursorBackgroundAgent; 