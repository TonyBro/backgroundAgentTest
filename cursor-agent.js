/**
 * Cursor Background Agent - Main Agent (Agent1)
 * Основной агент, который запускает второй агент и выполняет пинг-понг коммуникацию
 */

const { fork } = require('child_process');
const path = require('path');

class CursorBackgroundAgent {
    constructor() {
        this.agentId = 'Agent1';
        this.startTime = new Date();
        this.sessionId = this.generateSessionId();
        this.isRunning = false;
        
        // Для работы с вторичным агентом
        this.secondaryAgent = null;
        this.secondaryAgentReady = false;
        this.handshakeComplete = false;
        
        // Счетчики пинг-понг
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

        // Создаем вторичный агент с инструкциями
        this.createSecondaryAgentWithInstructions();

        // Обработка сигналов для корректного завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        process.on('SIGUSR1', () => this.showStatus());
    }

    createSecondaryAgentWithInstructions() {
        this.log('🔄 Создание второго агента с инструкциями...');
        
        const secondaryAgentPath = path.join(__dirname, 'cursor-agent-secondary.js');
        
        try {
            // Инструкции для второго агента
            const instructions = {
                role: 'secondary_agent',
                task: 'pingpong_responder',
                commands: [
                    'Запустись как Agent2',
                    'Отвечай на хэндшейк сообщением "Привет!"',
                    'На каждый PING отвечай PONG',
                    'Логируй все действия в консоль'
                ],
                parentAgentId: this.agentId,
                parentSessionId: this.sessionId
            };

            // Создаем процесс с инструкциями
            this.secondaryAgent = fork(secondaryAgentPath, [], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                env: {
                    ...process.env,
                    AGENT_INSTRUCTIONS: JSON.stringify(instructions)
                }
            });

            this.log(`✅ Второй агент создан с PID: ${this.secondaryAgent.pid}`);
            this.log('📋 Инструкции переданы второму агенту');

            // Обработка сообщений от вторичного агента
            this.secondaryAgent.on('message', (message) => {
                this.handleSecondaryAgentMessage(message);
            });

            // Обработка ошибок и завершения вторичного агента
            this.secondaryAgent.on('error', (error) => {
                this.log(`❌ Ошибка второго агента: ${error.message}`);
            });

            this.secondaryAgent.on('exit', (code, signal) => {
                this.log(`🚪 Второй агент завершился (code: ${code}, signal: ${signal})`);
                this.secondaryAgentReady = false;
                this.handshakeComplete = false;
            });

            // Отправляем инструкции второму агенту
            this.sendInstructionsToSecondaryAgent(instructions);

        } catch (error) {
            this.log(`❌ Ошибка создания второго агента: ${error.message}`);
        }
    }

    sendInstructionsToSecondaryAgent(instructions) {
        const instructionMessage = {
            type: 'instructions',
            data: instructions,
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.secondaryAgent.send(instructionMessage);
        this.log('📤 Инструкции отправлены второму агенту');
    }

    handleSecondaryAgentMessage(message) {
        this.log(`📨 [${this.agentId}] Получено сообщение от ${message.sender}: ${message.type}`);

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
                this.log(`⚠️ Неизвестный тип сообщения: ${message.type}`);
        }
    }

    handleSecondaryAgentReady(message) {
        this.log('✅ Второй агент готов к работе');
        this.log(`📋 Сообщение от Agent2: "${message.data}"`);
        this.secondaryAgentReady = true;
        
        // Инициируем хэндшейк
        setTimeout(() => {
            this.initiateHandshake();
        }, 500);
    }

    initiateHandshake() {
        if (!this.secondaryAgentReady) {
            this.log('⚠️ Второй агент не готов для хэндшейка');
            return;
        }

        this.log('🤝 Инициирую хэндшейк с вторым агентом');
        
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
        this.log('🤝 Получен ответ на хэндшейк от второго агента');
        this.log(`📥 [${this.agentId}] Второй агент ответил: "${message.data}"`);
        
        this.handshakeComplete = true;
        this.log('✅ Хэндшейк завершен! Готов к пинг-понг коммуникации');
        
        // Отправляем первый пинг
        this.sendPing();
    }

    sendPing() {
        if (!this.handshakeComplete || !this.secondaryAgent) {
            this.log('⚠️ Нельзя отправить пинг - система не готова');
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
        
        // Отправляем следующий пинг через небольшую паузу
        setTimeout(() => {
            this.sendPing();
        }, 1000);
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
        this.log(`Второй агент готов: ${this.secondaryAgentReady}`);
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

        // Завершаем второй агент
        if (this.secondaryAgent) {
            this.log('🔄 Завершение второго агента...');
            this.secondaryAgent.kill('SIGTERM');
            this.secondaryAgent = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Система агентов остановлена. Время работы: ${uptime}с`);
        this.log(`📊 Статистика: Пингов: ${this.pingCount}, Понгов: ${this.pongCount}`);
        
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