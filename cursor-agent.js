/**
 * Cursor Background Agent - Server Agent (Agent1)
 * Первый независимый агент, который работает как TCP сервер и ждет подключения второго агента
 */

const net = require('net');

class CursorBackgroundAgentServer {
    constructor(port = 3001) {
        this.agentId = 'Agent1-Server';
        this.port = port;
        this.startTime = new Date();
        this.sessionId = this.generateSessionId();
        this.isRunning = false;
        
        // TCP сервер и клиент
        this.server = null;
        this.clientSocket = null;
        this.isClientConnected = false;
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
            this.log('🔄 Сервер агент уже запущен');
            return;
        }

        this.isRunning = true;
        this.log('🚀 Запуск Agent1 как TCP сервера');
        this.log(`📋 Session ID: ${this.sessionId}`);
        this.log(`🔧 PID: ${process.pid}`);
        this.log(`🌐 Порт: ${this.port}`);

        this.createTCPServer();

        // Обработка сигналов для корректного завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        process.on('SIGUSR1', () => this.showStatus());
    }

    createTCPServer() {
        this.server = net.createServer((socket) => {
            this.log('🔗 Клиент подключился к серверу');
            this.clientSocket = socket;
            this.isClientConnected = true;

            // Обработка данных от клиента
            socket.on('data', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(message);
                } catch (error) {
                    this.log(`❌ Ошибка парсинга сообщения: ${error.message}`);
                }
            });

            // Обработка отключения клиента
            socket.on('close', () => {
                this.log('🚪 Клиент отключился');
                this.isClientConnected = false;
                this.handshakeComplete = false;
                this.clientSocket = null;
            });

            socket.on('error', (error) => {
                this.log(`❌ Ошибка сокета: ${error.message}`);
            });

            // Инициируем хэндшейк после подключения
            setTimeout(() => {
                this.initiateHandshake();
            }, 500);
        });

        this.server.listen(this.port, () => {
            this.log(`✅ TCP сервер запущен на порту ${this.port}`);
            this.log('⏳ Ожидание подключения Agent2...');
        });

        this.server.on('error', (error) => {
            this.log(`❌ Ошибка сервера: ${error.message}`);
        });
    }

    handleClientMessage(message) {
        this.log(`📨 [${this.agentId}] Получено от ${message.sender}: ${message.type} - "${message.data}"`);

        switch (message.type) {
            case 'ready':
                this.handleClientReady(message);
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

    handleClientReady(message) {
        this.log('✅ Agent2 готов к работе');
        this.log(`📋 Сообщение от Agent2: "${message.data}"`);
    }

    initiateHandshake() {
        if (!this.isClientConnected || !this.clientSocket) {
            this.log('⚠️ Клиент не подключен для хэндшейка');
            return;
        }

        this.log('🤝 Инициирую хэндшейк с Agent2');
        
        const handshakeMessage = {
            type: 'handshake_init',
            data: 'Привет!',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToClient(handshakeMessage);
        this.log(`📤 [${this.agentId}] Отправлен хэндшейк: "${handshakeMessage.data}"`);
    }

    handleHandshakeResponse(message) {
        this.log('🤝 Получен ответ на хэндшейк от Agent2');
        this.log(`📥 [${this.agentId}] Agent2 ответил: "${message.data}"`);
        
        this.handshakeComplete = true;
        this.log('✅ Хэндшейк завершен! Начинаю пинг-понг коммуникацию');
        
        // Отправляем первый пинг
        this.sendPing();
    }

    sendPing() {
        if (!this.handshakeComplete || !this.isClientConnected || !this.clientSocket) {
            this.log('⚠️ Нельзя отправить пинг - соединение не готово');
            return;
        }

        this.pingCount++;
        const pingMessage = {
            type: 'ping',
            data: `PING! 🏓 (#${this.pingCount})`,
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToClient(pingMessage);
        this.log(`🏓 [${this.agentId}] Отправлен PING: "${pingMessage.data}"`);
    }

    handlePong(message) {
        this.pongCount++;
        this.log(`🏓 [${this.agentId}] Получен PONG от ${message.sender}: "${message.data}" (#${this.pongCount})`);
        
        // Отправляем следующий пинг через секунду
        setTimeout(() => {
            this.sendPing();
        }, 1000);
    }

    sendToClient(message) {
        if (this.clientSocket && this.isClientConnected) {
            this.clientSocket.write(JSON.stringify(message));
        }
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
        this.log(`TCP порт: ${this.port}`);
        this.log(`Клиент подключен: ${this.isClientConnected}`);
        this.log(`Хэндшейк завершен: ${this.handshakeComplete}`);
        this.log(`Пингов отправлено: ${this.pingCount}`);
        this.log(`Понгов получено: ${this.pongCount}`);
        this.log('=== END STATUS ===');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\n🛑 Остановка сервер агента...');
        this.isRunning = false;

        // Закрываем соединение с клиентом
        if (this.clientSocket) {
            this.clientSocket.end();
            this.clientSocket = null;
        }

        // Закрываем сервер
        if (this.server) {
            this.server.close(() => {
                this.log('🔒 TCP сервер закрыт');
            });
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Сервер агент остановлен. Время работы: ${uptime}с`);
        this.log(`📊 Статистика: Пингов: ${this.pingCount}, Понгов: ${this.pongCount}`);
        
        process.exit(0);
    }

    getMetrics() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            agentId: this.agentId,
            isRunning: this.isRunning,
            sessionId: this.sessionId,
            uptime: uptime,
            port: this.port,
            clientConnected: this.isClientConnected,
            handshakeComplete: this.handshakeComplete,
            pingCount: this.pingCount,
            pongCount: this.pongCount
        };
    }
}

// Создание и запуск сервер агента
const serverAgent = new CursorBackgroundAgentServer();

// Запускаем агент
serverAgent.start();

// Экспортируем для возможного использования
module.exports = CursorBackgroundAgentServer; 