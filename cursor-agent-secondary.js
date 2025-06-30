/**
 * Cursor Background Agent - Secondary Agent (Agent2)
 * Второй агент, который получает инструкции от основного агента и выполняет пинг-понг
 */

class CursorSecondaryAgent {
    constructor() {
        this.agentId = 'Agent2';
        this.startTime = new Date();
        this.sessionId = this.generateSessionId();
        this.isReady = false;
        this.handshakeComplete = false;
        this.messageCount = 0;
        
        // Инструкции от основного агента
        this.instructions = null;
        this.parentAgentId = null;
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    start() {
        this.log('🚀 Второй агент (Agent2) запускается...');
        this.log(`📋 Session ID: ${this.sessionId}`);
        this.log(`🔧 PID: ${process.pid}`);

        // Проверяем инструкции из переменных окружения
        this.loadInstructionsFromEnv();

        // Настраиваем обработку сообщений от основного агента
        process.on('message', (message) => {
            this.handleMessage(message);
        });

        // Обработка сигналов завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());

        // Отправляем сигнал готовности основному агенту
        this.sendReady();
    }

    loadInstructionsFromEnv() {
        try {
            if (process.env.AGENT_INSTRUCTIONS) {
                this.instructions = JSON.parse(process.env.AGENT_INSTRUCTIONS);
                this.parentAgentId = this.instructions.parentAgentId;
                this.log('📋 Инструкции загружены из переменных окружения');
                this.executeInstructions();
            }
        } catch (error) {
            this.log(`⚠️ Ошибка загрузки инструкций: ${error.message}`);
        }
    }

    executeInstructions() {
        if (!this.instructions) {
            this.log('⚠️ Инструкции не найдены');
            return;
        }

        this.log('📝 Выполняю полученные инструкции:');
        this.instructions.commands.forEach((command, index) => {
            this.log(`   ${index + 1}. ${command}`);
        });

        this.log(`👤 Роль: ${this.instructions.role}`);
        this.log(`🎯 Задача: ${this.instructions.task}`);
        this.log(`🔗 Родительский агент: ${this.instructions.parentAgentId}`);
    }

    sendReady() {
        const message = {
            type: 'ready',
            data: 'Agent2 запущен и готов выполнять инструкции',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        process.send(message);
        this.isReady = true;
        this.log('✅ Отправлен сигнал готовности основному агенту');
    }

    handleMessage(message) {
        this.messageCount++;
        this.log(`📨 Получено сообщение: ${message.type} от ${message.sender}`);

        switch (message.type) {
            case 'instructions':
                this.handleInstructions(message);
                break;
            case 'handshake_init':
                this.handleHandshakeInit(message);
                break;
            case 'ping':
                this.handlePing(message);
                break;
            default:
                this.log(`⚠️ Неизвестный тип сообщения: ${message.type}`);
        }
    }

    handleInstructions(message) {
        this.log('📋 Получены инструкции от основного агента');
        this.instructions = message.data;
        this.parentAgentId = message.sender;
        
        this.log('📝 Инструкции получены:');
        this.instructions.commands.forEach((command, index) => {
            this.log(`   ${index + 1}. ${command}`);
        });

        this.executeInstructions();
    }

    handleHandshakeInit(message) {
        this.log('🤝 Получен запрос на хэндшейк от основного агента');
        this.log(`📥 ${message.sender} сказал: "${message.data}"`);

        // Выполняем инструкцию: "Отвечай на хэндшейк сообщением 'Привет!'"
        const response = {
            type: 'handshake_response',
            data: 'Привет!',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        process.send(response);
        this.handshakeComplete = true;
        this.log('📤 Ответил на хэндшейк: "Привет!" (согласно инструкциям)');
        this.log('✅ Хэндшейк завершен, готов к пинг-понг коммуникации');
    }

    handlePing(message) {
        if (!this.handshakeComplete) {
            this.log('⚠️ Получен пинг до завершения хэндшейка');
            return;
        }

        this.log(`🏓 Получен PING: "${message.data}"`);

        // Выполняем инструкцию: "На каждый PING отвечай PONG"
        const pongResponse = {
            type: 'pong',
            data: 'PONG! 🏓',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        process.send(pongResponse);
        this.log(`🏓 Отправлен PONG: "${pongResponse.data}" (согласно инструкциям)`);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${this.agentId}] ${message}`);
    }

    stop() {
        this.log('🛑 Остановка второго агента...');
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Второй агент остановлен. Время работы: ${uptime}с, Сообщений: ${this.messageCount}`);
        this.log('📋 Все инструкции были выполнены');
        process.exit(0);
    }

    getMetrics() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            agentId: this.agentId,
            sessionId: this.sessionId,
            isReady: this.isReady,
            handshakeComplete: this.handshakeComplete,
            uptime: uptime,
            messageCount: this.messageCount,
            parentAgentId: this.parentAgentId,
            instructionsReceived: !!this.instructions
        };
    }
}

// Создание и запуск второго агента
const secondaryAgent = new CursorSecondaryAgent();
secondaryAgent.start();

module.exports = CursorSecondaryAgent; 