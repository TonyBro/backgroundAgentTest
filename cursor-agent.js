/**
 * Cursor Background Agent - Server Agent (Agent1)
 * Первый независимый агент, который работает как TCP сервер и автоматически запускает второй агент
 */

const net = require('net');
const { exec } = require('child_process');
const path = require('path');

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
        
        // Управление вторым агентом
        this.secondaryAgentLaunched = false;
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
            
            // Автоматически запускаем второй агент в новом терминале
            setTimeout(() => {
                this.launchSecondaryAgentInNewTerminal();
            }, 1000);
        });

        this.server.on('error', (error) => {
            this.log(`❌ Ошибка сервера: ${error.message}`);
        });
    }

    launchSecondaryAgentInNewTerminal() {
        if (this.secondaryAgentLaunched) {
            this.log('⚠️ Второй агент уже был запущен');
            return;
        }

        this.log('🚀 Создание Agent2 в новом Cursor табе...');
        
        // Попытка использовать Cursor API для создания агента в новом табе
        this.createCursorAgentTab().catch(error => {
            this.log(`⚠️ Cursor API недоступен: ${error.message}`);
            this.log('🔄 Переход на системный способ запуска...');
            this.fallbackToSystemLaunch();
        });
    }

    async createCursorAgentTab() {
        // Проверяем доступность Cursor API
        if (typeof cursor === 'undefined' || !cursor.spawnTab) {
            throw new Error('Cursor API не найден');
        }

        const sessionId = this.sessionId;
        const serverPort = this.port;

        await cursor.spawnTab({
            name: "Agent2-Client",
            entry: async (ctx) => {
                const agent2 = await ctx.spawnAgent({
                    name: "Agent2",
                    systemPrompt: "Ты Agent2 - TCP клиент для пинг-понг коммуникации. Подключись к серверу Agent1 и участвуй в пинг-понг обмене сообщениями. Отвечай на пинги понгами.",
                });

                // Запускаем задачу Agent2
                const result = await agent2.runTask(`
                    Выполни следующие действия:
                    1. Создай TCP клиент для подключения к localhost:${serverPort}
                    2. Подключись к серверу Agent1
                    3. Отправь сигнал готовности: "Agent2 запущен через Cursor API и готов к работе"
                    4. Участвуй в хэндшейке: отвечай "Привет!" на приветствие сервера
                    5. Участвуй в пинг-понг коммуникации: на каждый PING отвечай PONG
                    6. Логируй все действия в консоль
                    
                    Используй Node.js модуль 'net' для TCP соединения.
                    Session ID родительского Agent1: ${sessionId}
                `);

                // Сохраняем результат в shared context
                ctx.shared = ctx.shared || {};
                ctx.shared.agent2Started = true;
                ctx.shared.agent2SessionId = sessionId;
                ctx.shared.agent2Result = result;
                
                return result;
            },
        });

        this.log('✅ Agent2 создан в новом Cursor табе через spawnTab API');
        this.secondaryAgentLaunched = true;
    }

    fallbackToSystemLaunch() {
        this.log('🔄 Fallback: запуск Agent2 в новом терминале...');
        
        // Простое решение через open команду для macOS
        const command = `open -a Terminal "${__dirname}/cursor-agent-secondary.js"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                this.log(`⚠️ Не удалось открыть через Terminal.app: ${error.message}`);
                
                // Попробуем альтернативный способ
                this.log('🔄 Попытка запуска напрямую...');
                const { spawn } = require('child_process');
                
                const agent2 = spawn('node', ['cursor-agent-secondary.js'], {
                    cwd: __dirname,
                    detached: true,
                    stdio: 'ignore'
                });
                
                agent2.unref();
                this.log('✅ Agent2 запущен в фоновом режиме (fallback)');
                this.secondaryAgentLaunched = true;
            } else {
                this.log('✅ Agent2 запущен в новом терминале (fallback)');
                this.secondaryAgentLaunched = true;
            }
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
        this.log(`Agent2 автозапущен: ${this.secondaryAgentLaunched}`);
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
        
        if (this.secondaryAgentLaunched) {
            this.log('💡 Не забудьте закрыть окно Agent2 вручную');
        }
        
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
            secondaryAgentLaunched: this.secondaryAgentLaunched,
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