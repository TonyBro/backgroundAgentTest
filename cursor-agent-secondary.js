/**
 * Cursor Background Agent - Simplified Agent2
 * Простой агент с TCP подключением к Agent1 и отправкой "Привет" каждые 10 секунд
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

class CursorBackgroundAgent {
    constructor(host = 'localhost', port = 3001) {
        this.agentId = 'Background-Agent2';
        this.host = host;
        this.port = port;
        this.startTime = new Date();
        this.sessionId = this.generateSessionId();
        this.isRunning = false;
        
        // TCP клиент для Agent1
        this.client = null;
        this.isConnected = false;
        this.handshakeComplete = false;
        this.messageCount = 0;
        this.pingCount = 0;
        this.helloCount = 0;
        
        // Настройки подключения
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 2000;
        
        // Таймер для отправки "Привет"
        this.helloInterval = null;
        
        // Настройки логирования
        this.logDir = path.join(__dirname, 'logs');
        this.logFile = path.join(this.logDir, `background-agent2-${this.sessionId}-${Date.now()}.log`);
        this.stepCounter = 0;
        
        // Создаем лог директорию
        this.initializeLogging();
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    initializeLogging() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
            
            const header = `
=== CURSOR BACKGROUND AGENT LOG ===
Session ID: ${this.sessionId}
Start Time: ${this.startTime.toISOString()}
PID: ${process.pid}
Target Agent1: ${this.host}:${this.port}
==========================================

`;
            fs.writeFileSync(this.logFile, header);
            console.log(`📝 Background Agent2 логи: ${this.logFile}`);
        } catch (error) {
            console.warn(`⚠️ Не удалось создать лог директорию: ${error.message}`);
        }
    }

    start() {
        if (this.isRunning) {
            this.log('🔄 Background агент уже запущен');
            return;
        }

        this.isRunning = true;
        
        this.log('🤖 ═══════════════════════════════════════');
        this.log('🤖    BACKGROUND AGENT STARTING');
        this.log('🤖 ═══════════════════════════════════════');
        this.log('🚀 Запуск Background Agent с функцией "Привет"');
        this.log(`📋 Session ID: ${this.sessionId}`);
        this.log(`🔧 PID: ${process.pid}`);
        this.log(`🌐 Agent1 сервер: ${this.host}:${this.port}`);

        // Подключаемся к Agent1
        this.connectToServer();

        // Обработка сигналов завершения
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    connectToServer() {
        this.log(`🔄 Подключение к Agent1 ${this.host}:${this.port}...`);
        
        this.client = new net.Socket();

        this.client.connect(this.port, this.host, () => {
            this.log('✅ Подключен к Agent1');
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
                this.log(`❌ Ошибка парсинга сообщения от Agent1: ${error.message}`);
            }
        });

        this.client.on('close', () => {
            this.log('🚪 Соединение с Agent1 закрыто');
            this.isConnected = false;
            this.handshakeComplete = false;
            this.stopHelloInterval();
            this.scheduleReconnect();
        });

        this.client.on('error', (error) => {
            this.log(`❌ Ошибка подключения к Agent1: ${error.message}`);
            this.isConnected = false;
            this.scheduleReconnect();
        });
    }

    scheduleReconnect() {
        if (!this.isRunning) return;
        
        this.reconnectAttempts++;
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            this.log(`❌ Превышено максимальное количество попыток подключения к Agent1 (${this.maxReconnectAttempts})`);
            return;
        }

        this.log(`🔄 Попытка переподключения к Agent1 #${this.reconnectAttempts} через ${this.reconnectInterval/1000}с...`);
        setTimeout(() => {
            if (this.isRunning) {
                this.connectToServer();
            }
        }, this.reconnectInterval);
    }

    sendReady() {
        const message = {
            type: 'ready',
            data: 'Background Agent запущен и готов к работе',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(message);
        this.log('✅ Отправлен сигнал готовности Agent1');
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
                this.log(`⚠️ Неизвестный тип сообщения от Agent1: ${message.type}`);
        }
    }

    handleHandshakeInit(message) {
        this.log('🤝 Получен запрос на хэндшейк от Agent1');
        this.log(`📥 ${message.sender} сказал: "${message.data}"`);

        // Отвечаем на хэндшейк
        const response = {
            type: 'handshake_response',
            data: 'Привет! Background Agent готов!',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(response);
        this.handshakeComplete = true;
        this.log('📤 Ответил на хэндшейк Agent1: "Привет! Background Agent готов!"');
        this.log('✅ Хэндшейк с Agent1 завершен');
        
        // После хэндшейка запускаем отправку "Привет" каждые 10 секунд
        this.startHelloInterval();
    }

    handlePing(message) {
        if (!this.handshakeComplete) {
            this.log('⚠️ Получен пинг до завершения хэндшейка');
            return;
        }

        this.pingCount++;
        this.log(`🏓 [${this.agentId}] Получен PING #${this.pingCount}: "${message.data}"`);

        // Отвечаем понгом
        const pongResponse = {
            type: 'pong',
            data: 'PONG! 🏓 (Background Agent)',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(pongResponse);
        this.log(`🏓 [${this.agentId}] Отправлен PONG #${this.pingCount}: "${pongResponse.data}"`);
    }

    // Функция для запуска отправки "Привет" каждые 10 секунд
    startHelloInterval() {
        this.log('🎯 Запуск функции отправки "Привет" каждые 10 секунд...');
        
        this.helloInterval = setInterval(() => {
            this.sendHelloMessage();
        }, 10000); // 10 секунд = 10000 миллисекунд
        
        // Отправляем первое сообщение сразу
        this.sendHelloMessage();
    }

    // Функция остановки интервала "Привет"
    stopHelloInterval() {
        if (this.helloInterval) {
            clearInterval(this.helloInterval);
            this.helloInterval = null;
            this.log('⏹️ Остановка функции отправки "Привет"');
        }
    }

    // Функция отправки сообщения "Привет" в чат AI-агента
    sendHelloMessage() {
        if (!this.isConnected || !this.handshakeComplete) {
            this.log('⚠️ Нет подключения к Agent1 для отправки "Привет"');
            return;
        }

        this.helloCount++;
        
        const helloMessage = {
            type: 'chat_message',
            data: 'Привет',
            timestamp: new Date().toISOString(),
            sender: this.agentId,
            messageNumber: this.helloCount
        };

        this.sendToServer(helloMessage);
        this.log(`💬 [${this.agentId}] Отправлен "Привет" #${this.helloCount} в чат AI-агента`);
    }

    sendToServer(message) {
        if (this.client && this.isConnected) {
            this.client.write(JSON.stringify(message));
        } else {
            this.log('⚠️ Нет соединения с Agent1 для отправки сообщения');
        }
    }

    // Функция для отправки сообщения в бэкграунд AI-агента
    sendToBackgroundAgent(message) {
        this.log(`🎯 Background событие: ${message}`);
    }

    getAgentStatus() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            agentId: this.agentId,
            isRunning: this.isRunning,
            sessionId: this.sessionId,
            uptime: uptime,
            agent1Connection: {
                host: this.host,
                port: this.port,
                isConnected: this.isConnected,
                handshakeComplete: this.handshakeComplete
            },
            messageCount: this.messageCount,
            pingCount: this.pingCount,
            helloCount: this.helloCount,
            helloIntervalActive: this.helloInterval !== null
        };
    }

    log(message) {
        const timestamp = new Date().toISOString();
        this.stepCounter++;
        
        // Формируем сообщение для консоли
        const consoleMessage = `[${timestamp}] ${message}`;
        console.log(consoleMessage);
        
        // Формируем сообщение для файла
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        const fileMessage = `${timestamp} [STEP-${this.stepCounter}] [${this.agentId}] [UPTIME:${uptime}s] ${message}\n`;
        
        // Записываем в файл
        try {
            fs.appendFileSync(this.logFile, fileMessage);
        } catch (error) {
            console.warn(`⚠️ Ошибка записи в лог файл: ${error.message}`);
        }
    }

    showStatus() {
        const status = this.getAgentStatus();
        this.log('=== BACKGROUND AGENT STATUS ===');
        this.log(`Время работы: ${status.uptime} секунд`);
        this.log(`Session ID: ${status.sessionId}`);
        this.log(`Agent1 соединение: ${status.agent1Connection.isConnected}`);
        this.log(`Хэндшейк завершен: ${status.agent1Connection.handshakeComplete}`);
        this.log(`Сообщений от Agent1: ${status.messageCount}`);
        this.log(`Отправлено PONG: ${status.pingCount}`);
        this.log(`Отправлено "Привет": ${status.helloCount}`);
        this.log(`Интервал "Привет" активен: ${status.helloIntervalActive}`);
        this.log('=== END STATUS ===');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\n🛑 Остановка Background Agent...');
        this.isRunning = false;

        // Останавливаем интервал "Привет"
        this.stopHelloInterval();

        // Закрываем соединение с Agent1
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ Background Agent остановлен. Время работы: ${uptime}с`);
        this.log(`📊 Сообщений от Agent1: ${this.messageCount}`);
        this.log(`📊 Отправлено "Привет": ${this.helloCount}`);
        
        process.exit(0);
    }
}

// Создаем и запускаем агент
const agent = new CursorBackgroundAgent();

// Показываем статус каждые 30 секунд
setInterval(() => {
    if (agent.isRunning) {
        agent.showStatus();
    }
}, 30000);

// Запускаем агент
agent.start();

// Экспортируем для использования в других модулях
module.exports = CursorBackgroundAgent; 