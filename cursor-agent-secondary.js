/**
 * Cursor Background Agent - Secondary (Agent 2)
 * Вторичный агент для пинг-понг коммуникации
 */

class CursorSecondaryAgent {
    constructor() {
        this.agentId = 'Agent2';
        this.startTime = new Date();
        this.messageCount = 0;
        this.sessionId = this.generateSessionId();
        this.isReady = false;
        this.handshakeComplete = false;
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    start() {
        this.log('🚀 Вторичный агент запущен');
        this.log(`Session ID: ${this.sessionId}`);
        this.log(`PID: ${process.pid}`);

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

    sendReady() {
        const message = {
            type: 'ready',
            data: 'Вторичный агент готов к работе',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        process.send(message);
        this.isReady = true;
        this.log('✅ Отправлен сигнал готовности основному агенту');
    }

    handleMessage(message) {
        this.messageCount++;
        this.log(`📨 Получено сообщение: ${message.type} - "${message.data}"`);

        switch (message.type) {
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

    handleHandshakeInit(message) {
        this.log('🤝 Получен запрос на хэндшейк от основного агента');
        this.log(`📥 Основной агент сказал: "${message.data}"`);

        // Отправляем ответ на хэндшейк
        const response = {
            type: 'handshake_response',
            data: 'Привет!',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        process.send(response);
        this.handshakeComplete = true;
        this.log('📤 Ответил на хэндшейк: "Привет!"');
        this.log('✅ Хэндшейк завершен, готов к пинг-понг коммуникации');
    }

    handlePing(message) {
        if (!this.handshakeComplete) {
            this.log('⚠️ Получен пинг до завершения хэндшейка');
            return;
        }

        this.log(`🏓 Получен PING: "${message.data}"`);

        // Отправляем понг в ответ на пинг
        const pongResponse = {
            type: 'pong',
            data: 'PONG! 🏓',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        process.send(pongResponse);
        this.log(`🏓 Отправлен PONG: "${pongResponse.data}"`);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${this.agentId}] ${message}`);
    }

    stop() {
        this.log('🛑 Остановка вторичного агента...');
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Вторичный агент остановлен. Время работы: ${uptime}с, Сообщений: ${this.messageCount}`);
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
            messageCount: this.messageCount
        };
    }
}

// Создание и запуск вторичного агента
const secondaryAgent = new CursorSecondaryAgent();
secondaryAgent.start();

module.exports = CursorSecondaryAgent; 