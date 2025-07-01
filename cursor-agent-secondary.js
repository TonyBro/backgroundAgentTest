/**
 * Cursor AI Background Agent - Enhanced Agent2
 * AI агент с поддержкой Initial Prompt, внешних инструкций и фазовой обработки задач
 */

const net = require('net');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const express = require('express');
const chokidar = require('chokidar');
const { v4: uuidv4 } = require('uuid');

class CursorAIBackgroundAgent {
    constructor(host = 'localhost', port = 3001) {
        this.agentId = 'AI-Agent2';
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
        this.pingCount = 0; // Исправление бага
        
        // Настройки подключения
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 2000;
        
        // AI Task Manager
        this.aiTaskManager = new AITaskManager();
        this.externalInterfaceManager = new ExternalInterfaceManager(this);
        this.taskPhaseProcessor = new TaskPhaseProcessor(this);
        
        // Настройки логирования и директорий
        this.logDir = path.join(__dirname, 'logs');
        this.instructionsDir = path.join(__dirname, 'instructions');
        this.resultsDir = path.join(__dirname, 'results');
        this.logFile = path.join(this.logDir, `ai-agent2-${this.sessionId}-${Date.now()}.log`);
        this.stepCounter = 0;
        
        // Состояние агента
        this.agentStatus = 'starting';
        this.currentPhase = 'initial';
        this.tasksCompleted = 0;
        this.lastInstruction = null;
        
        // Создаем необходимые директории
        this.initializeDirectories();
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    initializeDirectories() {
        try {
            // Создаем все необходимые директории
            const dirs = [this.logDir, this.instructionsDir, this.resultsDir];
            dirs.forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            });
            
            // Записываем заголовок лог файла
            const header = `
=== CURSOR AI BACKGROUND AGENT LOG ===
Session ID: ${this.sessionId}
Start Time: ${this.startTime.toISOString()}
PID: ${process.pid}
Target Agent1: ${this.host}:${this.port}
Log File: ${this.logFile}
Instructions Dir: ${this.instructionsDir}
Results Dir: ${this.resultsDir}
==========================================

`;
            fs.writeFileSync(this.logFile, header);
            console.log(`📝 AI Agent2 логи: ${this.logFile}`);
            console.log(`📁 Инструкции: ${this.instructionsDir}`);
            console.log(`📁 Результаты: ${this.resultsDir}`);
        } catch (error) {
            console.warn(`⚠️ Не удалось создать директории: ${error.message}`);
        }
    }

    async start() {
        if (this.isRunning) {
            this.log('🔄 AI агент уже запущен');
            return;
        }

        this.isRunning = true;
        this.agentStatus = 'initializing';
        
        this.log('🤖 ═══════════════════════════════════════');
        this.log('🤖      AI BACKGROUND AGENT STARTING');
        this.log('🤖 ═══════════════════════════════════════');
        this.log('🚀 Запуск AI Background Agent с расширенными возможностями');
        this.log(`📋 Session ID: ${this.sessionId}`);
        this.log(`🔧 PID: ${process.pid}`);
        this.log(`🌐 Agent1 сервер: ${this.host}:${this.port}`);

        // Запускаем внешние интерфейсы
        await this.externalInterfaceManager.startAll();
        
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
            return; // Не останавливаем агент, продолжаем работать
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
            data: 'AI Background Agent запущен и готов к работе',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(message);
        this.log('✅ Отправлен сигнал готовности Agent1');
    }

    async handleServerMessage(message) {
        this.messageCount++;
        this.log(`📨 [${this.agentId}] Получено от ${message.sender}: ${message.type} - "${message.data}"`);

        switch (message.type) {
            case 'handshake_init':
                await this.handleHandshakeInit(message);
                break;
            case 'ping':
                this.handlePing(message);
                break;
            default:
                this.log(`⚠️ Неизвестный тип сообщения от Agent1: ${message.type}`);
        }
    }

    async handleHandshakeInit(message) {
        this.log('🤝 Получен запрос на хэндшейк от Agent1');
        this.log(`📥 ${message.sender} сказал: "${message.data}"`);

        // Отвечаем на хэндшейк
        const response = {
            type: 'handshake_response',
            data: 'Привет! AI Agent готов!',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(response);
        this.handshakeComplete = true;
        this.log('📤 Ответил на хэндшейк Agent1: "Привет! AI Agent готов!"');
        this.log('✅ Хэндшейк с Agent1 завершен');
        
        // После хэндшейка выполняем Initial Prompt
        await this.executeInitialPrompt();
    }

    async executeInitialPrompt() {
        this.log('🎯 Выполнение Initial Prompt...');
        this.agentStatus = 'processing_initial';
        this.currentPhase = 'initial';
        
        try {
            const result = await this.aiTaskManager.executeInitialPrompt();
            this.log('✅ Initial Prompt выполнен успешно');
            this.log(`📊 Результат: ${result.summary}`);
            
            // Сохраняем результат
            await this.taskPhaseProcessor.savePhaseResult('initial', result);
            
            // Переходим в режим ожидания инструкций
            this.agentStatus = 'waiting_instructions';
            this.log('⏳ Агент готов к приему внешних инструкций...');
            
        } catch (error) {
            this.log(`❌ Ошибка выполнения Initial Prompt: ${error.message}`);
            this.agentStatus = 'error';
        }
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
            data: 'PONG! 🏓 (AI Agent)',
            timestamp: new Date().toISOString(),
            sender: this.agentId
        };

        this.sendToServer(pongResponse);
        this.log(`🏓 [${this.agentId}] Отправлен PONG #${this.pingCount}: "${pongResponse.data}"`);
    }

    // Метод для приема внешних инструкций
    async processExternalInstruction(instruction, source = 'unknown') {
        try {
            this.log(`📥 Получена внешняя инструкция из ${source}:`);
            this.log(`    "${instruction}"`);
            
            this.agentStatus = 'processing_instruction';
            this.lastInstruction = {
                id: uuidv4(),
                instruction: instruction,
                source: source,
                timestamp: new Date().toISOString(),
                phase: `phase-${this.tasksCompleted + 1}`
            };
            
            this.currentPhase = this.lastInstruction.phase;
            
            // Обрабатываем инструкцию как новую фазу
            const result = await this.aiTaskManager.processInstruction(instruction, this.currentPhase);
            
            // Сохраняем результат фазы
            await this.taskPhaseProcessor.savePhaseResult(this.currentPhase, result);
            
            this.tasksCompleted++;
            this.agentStatus = 'waiting_instructions';
            
            this.log(`✅ Инструкция обработана успешно (фаза: ${this.currentPhase})`);
            this.log(`📊 Результат: ${result.summary}`);
            this.log('⏳ Ожидание следующих инструкций...');
            
            return result;
            
        } catch (error) {
            this.log(`❌ Ошибка обработки инструкции: ${error.message}`);
            this.agentStatus = 'error';
            throw error;
        }
    }

    sendToServer(message) {
        if (this.client && this.isConnected) {
            this.client.write(JSON.stringify(message));
        } else {
            this.log('⚠️ Нет соединения с Agent1 для отправки сообщения');
        }
    }

    // Исправленный метод sendToBackgroundAgent
    sendToBackgroundAgent(message) {
        // Теперь этот агент сам и есть background agent, 
        // поэтому просто логируем как внутреннее событие
        this.log(`🎯 Background событие: ${message}`);
    }

    getAgentStatus() {
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        return {
            agentId: this.agentId,
            status: this.agentStatus,
            currentPhase: this.currentPhase,
            tasksCompleted: this.tasksCompleted,
            isRunning: this.isRunning,
            sessionId: this.sessionId,
            uptime: uptime,
            interfaces: this.externalInterfaceManager.getStatus(),
            agent1Connection: {
                host: this.host,
                port: this.port,
                isConnected: this.isConnected,
                handshakeComplete: this.handshakeComplete
            },
            messageCount: this.messageCount,
            pingCount: this.pingCount,
            lastInstruction: this.lastInstruction
        };
    }

    log(message, step = null, data = null) {
        const timestamp = new Date().toISOString();
        this.stepCounter++;
        
        // Формируем сообщение для консоли
        const consoleMessage = `[${timestamp}] ${message}`;
        console.log(consoleMessage);
        
        // Формируем детальное сообщение для файла
        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        const stepInfo = step ? `[STEP-${step}]` : `[STEP-${this.stepCounter}]`;
        
        const fileMessage = `${timestamp} ${stepInfo} [${this.agentId}] [${this.agentStatus}] [${this.currentPhase}] [UPTIME:${uptime}s] ${message}`;
        
        // Добавляем дополнительные данные если есть
        let additionalData = '';
        if (data) {
            additionalData = `\n    └─ DATA: ${JSON.stringify(data, null, 2).split('\n').join('\n    ')}`;
        }
        
        // Добавляем статистику к важным событиям
        let stats = '';
        if (message.includes('PING') || message.includes('PONG') || message.includes('подключ') || message.includes('инструкция')) {
            const status = this.getAgentStatus();
            stats = `\n    └─ STATS: Status:${status.status} | Phase:${status.currentPhase} | Tasks:${status.tasksCompleted} | Interfaces:${JSON.stringify(status.interfaces)}`;
        }
        
        const fullLogEntry = fileMessage + additionalData + stats + '\n';
        
        // Записываем в файл
        try {
            fs.appendFileSync(this.logFile, fullLogEntry);
        } catch (error) {
            console.warn(`⚠️ Ошибка записи в лог файл: ${error.message}`);
        }
    }

    showStatus() {
        const status = this.getAgentStatus();
        this.log('=== AI AGENT STATUS REPORT ===');
        this.log(`Статус: ${status.status}`);
        this.log(`Текущая фаза: ${status.currentPhase}`);
        this.log(`Выполнено задач: ${status.tasksCompleted}`);
        this.log(`Время работы: ${status.uptime} секунд`);
        this.log(`Session ID: ${status.sessionId}`);
        this.log(`Agent1 соединение: ${status.agent1Connection.isConnected}`);
        this.log(`Внешние интерфейсы: ${JSON.stringify(status.interfaces, null, 2)}`);
        this.log('=== END AI AGENT STATUS ===');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.log('\n🛑 Остановка AI Background Agent...');
        this.isRunning = false;
        this.agentStatus = 'stopping';

        // Останавливаем внешние интерфейсы
        this.externalInterfaceManager.stopAll();

        // Закрываем соединение с Agent1
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }

        const uptime = Math.floor((new Date() - this.startTime) / 1000);
        this.log(`✅ AI Background Agent остановлен. Время работы: ${uptime}с`);
        this.log(`📊 Выполнено задач: ${this.tasksCompleted}`);
        this.log(`📊 Сообщений от Agent1: ${this.messageCount}`);
        
        process.exit(0);
    }
}

// AI Task Manager - управление AI задачами
class AITaskManager {
    constructor() {
        this.initialPrompt = "Проанализировать текущее состояние системы, проверить доступные ресурсы и подготовиться к выполнению AI задач. Определить возможности агента и области применения.";
    }

    async executeInitialPrompt() {
        // Симуляция AI анализа с задержкой
        await this.delay(2000);
        
        const analysis = {
            timestamp: new Date().toISOString(),
            prompt: this.initialPrompt,
            summary: "Система инициализирована, AI агент готов к работе",
            details: {
                systemStatus: "operational",
                availableResources: ["файловая система", "сетевые интерфейсы", "логирование"],
                capabilities: ["обработка инструкций", "анализ данных", "фазовое выполнение задач"],
                readyForTasks: true
            },
            recommendations: [
                "Агент готов принимать внешние инструкции",
                "Доступны интерфейсы: WebSocket, REST API, файловый мониторинг",
                "Логирование и сохранение результатов настроено"
            ]
        };
        
        return analysis;
    }

    async processInstruction(instruction, phase) {
        // Симуляция обработки инструкции
        await this.delay(1500);
        
        const result = {
            timestamp: new Date().toISOString(),
            phase: phase,
            instruction: instruction,
            summary: `Инструкция обработана в фазе ${phase}`,
            details: {
                processingTime: "1.5s",
                status: "completed",
                actions: [
                    "Анализ инструкции",
                    "Определение стратегии выполнения",
                    "Выполнение задачи",
                    "Подготовка результата"
                ]
            },
            output: `Результат выполнения: "${instruction}" в фазе ${phase}`,
            nextSteps: "Ожидание следующей инструкции"
        };
        
        return result;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// External Interface Manager - управление внешними интерфейсами
class ExternalInterfaceManager {
    constructor(agent) {
        this.agent = agent;
        this.websocketServer = null;
        this.restServer = null;
        this.fileWatcher = null;
        this.websocketPort = 3020;
        this.restPort = 3021;
        this.interfaces = {
            websocket: 'inactive',
            rest: 'inactive',
            file: 'inactive'
        };
    }

    async startAll() {
        await this.setupWebSocketServer();
        await this.setupRESTAPI();
        await this.setupFileMonitor();
    }

    async setupWebSocketServer() {
        try {
            this.websocketServer = new WebSocket.Server({ port: this.websocketPort });
            
            this.websocketServer.on('connection', (ws) => {
                this.agent.log(`🔌 WebSocket клиент подключен`);
                
                ws.on('message', async (message) => {
                    try {
                        const instruction = message.toString();
                        await this.agent.processExternalInstruction(instruction, 'websocket');
                        ws.send(JSON.stringify({ status: 'success', message: 'Инструкция обработана' }));
                    } catch (error) {
                        ws.send(JSON.stringify({ status: 'error', message: error.message }));
                    }
                });
                
                ws.on('close', () => {
                    this.agent.log(`🔌 WebSocket клиент отключен`);
                });
            });
            
            this.interfaces.websocket = 'active';
            this.agent.log(`✅ WebSocket сервер запущен на порту ${this.websocketPort}`);
            
        } catch (error) {
            this.agent.log(`❌ Ошибка запуска WebSocket сервера: ${error.message}`);
        }
    }

    async setupRESTAPI() {
        try {
            const app = express();
            app.use(express.json());
            
            // POST /instruction - отправить инструкцию
            app.post('/instruction', async (req, res) => {
                try {
                    const { instruction } = req.body;
                    if (!instruction) {
                        return res.status(400).json({ error: 'Instruction is required' });
                    }
                    
                    const result = await this.agent.processExternalInstruction(instruction, 'rest');
                    res.json({ status: 'success', result: result });
                    
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            });
            
            // GET /status - получить статус агента
            app.get('/status', (req, res) => {
                res.json(this.agent.getAgentStatus());
            });
            
            this.restServer = app.listen(this.restPort, () => {
                this.interfaces.rest = 'active';
                this.agent.log(`✅ REST API запущен на порту ${this.restPort}`);
            });
            
        } catch (error) {
            this.agent.log(`❌ Ошибка запуска REST API: ${error.message}`);
        }
    }

    async setupFileMonitor() {
        try {
            this.fileWatcher = chokidar.watch(this.agent.instructionsDir, {
                ignored: /^\./, 
                persistent: true
            });
            
            this.fileWatcher.on('add', async (filePath) => {
                try {
                    if (path.extname(filePath) === '.txt') {
                        const instruction = fs.readFileSync(filePath, 'utf8').trim();
                        if (instruction) {
                            await this.agent.processExternalInstruction(instruction, 'file');
                            // Перемещаем обработанный файл
                            const processedPath = path.join(this.agent.resultsDir, `processed-${Date.now()}-${path.basename(filePath)}`);
                            fs.renameSync(filePath, processedPath);
                        }
                    }
                } catch (error) {
                    this.agent.log(`❌ Ошибка обработки файла ${filePath}: ${error.message}`);
                }
            });
            
            this.interfaces.file = 'active';
            this.agent.log(`✅ Файловый мониторинг запущен для папки: ${this.agent.instructionsDir}`);
            
        } catch (error) {
            this.agent.log(`❌ Ошибка запуска файлового мониторинга: ${error.message}`);
        }
    }

    getStatus() {
        return this.interfaces;
    }

    stopAll() {
        if (this.websocketServer) {
            this.websocketServer.close();
            this.interfaces.websocket = 'inactive';
        }
        
        if (this.restServer) {
            this.restServer.close();
            this.interfaces.rest = 'inactive';
        }
        
        if (this.fileWatcher) {
            this.fileWatcher.close();
            this.interfaces.file = 'inactive';
        }
    }
}

// Task Phase Processor - управление фазами задач
class TaskPhaseProcessor {
    constructor(agent) {
        this.agent = agent;
    }

    async savePhaseResult(phase, result) {
        try {
            const resultFile = path.join(this.agent.resultsDir, `${phase}-${Date.now()}.json`);
            const resultData = {
                phase: phase,
                timestamp: new Date().toISOString(),
                sessionId: this.agent.sessionId,
                result: result
            };
            
            fs.writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
            this.agent.log(`💾 Результат фазы ${phase} сохранен: ${resultFile}`);
            
        } catch (error) {
            this.agent.log(`❌ Ошибка сохранения результата фазы ${phase}: ${error.message}`);
        }
    }
}

// Создание и запуск AI агента
const aiAgent = new CursorAIBackgroundAgent();

// Запускаем агент
aiAgent.start();

module.exports = CursorAIBackgroundAgent; 