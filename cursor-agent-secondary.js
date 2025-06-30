/**
 * Cursor Background Agent - Client Agent (Agent2)
 * Второй независимый агент, который работает как TCP клиент и подключается к первому агенту
 */

const net = require('net');

class CursorBackgroundAgentClient {
    constructor(host = 'localhost', port = 3001) {
        this.agentId = 'Agent2-Client';
        this.host = host;
        this.port = port;
        this.startTime = new Date();
        this.sessionId = this.generateSessionId();
        this.isRunning = false;
        
        // TCP клиент
        this.client = null;
        this.isConnected = false;
        this.handshakeComplete = false;
        this.messageCount = 0;
        
        // Настройки подключения
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 2000;
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    start() {
        if (this.isRunning) {
            this.log('🔄 Клиент агент уже запущен');
            return;
        }

        this.isRunning = true;
        this.log('🚀 Запуск Agent2 как TCP клиента');
        this.log(`📋 Session ID: ${this.sessionId}`);
        this.log(`🔧 PID: ${process.pid}`);
        this.log(`🌐 Подключение к: ${this.host}:${this.port}`);

        this.connectToServer();

        // Обработка сигналов завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    connectToServer() {
        this.log(`🔄 Попытка подключения к серверу ${this.host}:${this.port}...`);
        
        this.client = new net.Socket();

        this.client.connect(this.port, this.host, () => {
            this.log('✅ Успешно подключен к серверу');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Отправляем сигнал готовности
            this.sendReady();
        });

        this.client.on('data', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleServerMessage(message);
            } catch (error) {
                this.log(`❌ Ошибка парсинга сообщения: ${error.message}`);
            }
        });

        this.client.on('close', () => {
            this.log('🚪 Соединение с сервером закрыто');
            this.isConnected = false;
            this.handshakeComplete = false;
            this.scheduleReconnect();
        });

        this.client.on('error', (error) => {
            this.log(`❌ Ошибка подключения: ${error.message}`);
            this.isConnected = false;
            this.scheduleReconnect();
        });
    }

    scheduleReconnect() {
        if (!this.isRunning) return;
        
        this.reconnectAttempts++;
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            this.log(`❌ Превышено максимальное количество попыток подключения (${this.maxReconnectAttempts})`);
            this.stop();
            return;
        }

        this.log(`🔄 Попытка переподключения #${this.reconnectAttempts} через ${this.reconnectInterval/1000}с...`);
        setTimeout(() => {
            if (this.isRunning) {
                this.connectToServer();
            }
        }, this.reconnectInterval);
    }

    sendReady() {
        const message = {
            type: 'ready',
            data: 'Agent2 запущен и готов к работе',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(message);
        this.log('✅ Отправлен сигнал готовности серверу');
    }

    handleServerMessage(message) {
        this.messageCount++;
        this.log(`📨 [${this.agentId}] Получено от ${message.sender}: ${message.type} - "${message.data}"`);

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
        this.log('🤝 Получен запрос на хэндшейк от сервера');
        this.log(`📥 ${message.sender} сказал: "${message.data}"`);

        // Отвечаем на хэндшейк
        const response = {
            type: 'handshake_response',
            data: 'Привет!',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(response);
        this.handshakeComplete = true;
        this.log('📤 Ответил на хэндшейк: "Привет!"');
        this.log('✅ Хэндшейк завершен, готов к пинг-понг коммуникации');
    }

    handlePing(message) {
        if (!this.handshakeComplete) {
            this.log('⚠️ Получен пинг до завершения хэндшейка');
            return;
        }

        this.log(`🏓 [${this.agentId}] Получен PING: "${message.data}"`);

        // Отвечаем понгом
        const pongResponse = {
            type: 'pong',
            data: 'PONG! 🏓',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(pongResponse);
        this.log(`🏓 [${this.agentId}] Отправлен PONG: "${pongResponse.data}"`);
    }

    sendToServer(message) {
        if (this.client && this.isConnected) {
            this.client.write(JSON.stringify(message));
        } else {
            this.log('⚠️ Нет соединения с сервером для отправки сообщения');
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    showStatus() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log('=== CLIENT STATUS REPORT ===');
        this.log(`[${this.agentId}] Статус: ${this.isRunning ? 'Активен' : 'Остановлен'}`);
        this.log(`Время работы: ${uptime} секунд`);
        this.log(`Session ID: ${this.sessionId}`);
        this.log(`Сервер: ${this.host}:${this.port}`);
        this.log(`Подключен к серверу: ${this.isConnected}`);
        this.log(`Хэндшейк завершен: ${this.handshakeComplete}`);
        this.log(`Сообщений получено: ${this.messageCount}`);
        this.log(`Попыток переподключения: ${this.reconnectAttempts}`);
        this.log('=== END CLIENT STATUS ===');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\n🛑 Остановка клиент агента...');
        this.isRunning = false;

        // Закрываем соединение
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Клиент агент остановлен. Время работы: ${uptime}с`);
        this.log(`📊 Сообщений обработано: ${this.messageCount}`);
        
        process.exit(0);
    }

    getMetrics() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            agentId: this.agentId,
            isRunning: this.isRunning,
            sessionId: this.sessionId,
            uptime: uptime,
            host: this.host,
            port: this.port,
            isConnected: this.isConnected,
            handshakeComplete: this.handshakeComplete,
            messageCount: this.messageCount,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Создание и запуск клиент агента
const clientAgent = new CursorBackgroundAgentClient();

// Запускаем агент
clientAgent.start();

module.exports = CursorBackgroundAgentClient; 