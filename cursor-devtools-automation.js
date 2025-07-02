const puppeteer = require('puppeteer-core');
const WebSocket = require('ws');

class CursorChatAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.wsServer = null;
  }

  // Подключение к Cursor через Chrome DevTools Protocol
  async connectToCursor() {
    try {
      // Cursor работает на Electron, нужно найти его debugging port
      // Обычно Electron приложения запускаются с --remote-debugging-port
      const debuggingPort = 9222; // Может потребоваться настройка
      
      this.browser = await puppeteer.connect({
        browserURL: `http://localhost:${debuggingPort}`,
        defaultViewport: null
      });

      const pages = await this.browser.pages();
      // Ищем страницу Cursor (обычно первая или с определённым title)
      this.page = pages.find(page => page.url().includes('cursor')) || pages[0];
      
      console.log('Подключен к Cursor через DevTools Protocol');
      return true;
    } catch (error) {
      console.error('Ошибка подключения к Cursor:', error);
      return false;
    }
  }

  // Инжектирование и выполнение кода в контексте Cursor
  async injectChatFunction() {
    if (!this.page) {
      throw new Error('Не подключен к Cursor');
    }

    // Инжектируем функцию для отправки сообщений
    await this.page.evaluateOnNewDocument(() => {
      window.sendMessageToChat = (message) => {
        // Здесь будет код, найденный на этапе исследования
        // Например:
        try {
          // Замени на реальную функцию, найденную в Cursor
          if (window.cursorAPI && window.cursorAPI.chat) {
            window.cursorAPI.chat.sendMessage(message);
          } else if (window.vscode && window.vscode.postMessage) {
            window.vscode.postMessage({
              type: 'chat-message',
              content: message
            });
          } else {
            // Fallback: попытка найти функцию динамически
            console.log('Попытка отправить сообщение:', message);
            // Здесь добавим код поиска функций
          }
          return true;
        } catch (error) {
          console.error('Ошибка отправки сообщения:', error);
          return false;
        }
      };
    });
  }

  // Отправка сообщения в чат Cursor
  async sendMessage(message) {
    if (!this.page) {
      throw new Error('Не подключен к Cursor');
    }

    try {
      const result = await this.page.evaluate((msg) => {
        return window.sendMessageToChat(msg);
      }, message);

      console.log('Сообщение отправлено:', message);
      return result;
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      return false;
    }
  }

  // Запуск WebSocket сервера для получения сообщений от других агентов
  startWebSocketServer(port = 3001) {
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws) => {
      console.log('Новое WebSocket подключение');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Получено сообщение от агента:', message);
          
          if (message.type === 'chat-message') {
            await this.sendMessage(message.content);
          }
        } catch (error) {
          console.error('Ошибка обработки сообщения:', error);
        }
      });
    });

    console.log(`WebSocket сервер запущен на порту ${port}`);
  }

  // Основной метод запуска
  async start() {
    console.log('Запуск автоматизации Cursor чата...');
    
    // Подключаемся к Cursor
    const connected = await this.connectToCursor();
    if (!connected) {
      throw new Error('Не удалось подключиться к Cursor');
    }

    // Инжектируем функции
    await this.injectChatFunction();

    // Запускаем WebSocket сервер
    this.startWebSocketServer();

    console.log('Автоматизация готова к работе!');
  }

  // Остановка и очистка
  async stop() {
    if (this.browser) {
      await this.browser.disconnect();
    }
    if (this.wsServer) {
      this.wsServer.close();
    }
    console.log('Автоматизация остановлена');
  }
}

// Использование
const automation = new CursorChatAutomation();

// Запуск
automation.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nОстановка автоматизации...');
  await automation.stop();
  process.exit(0);
});

module.exports = CursorChatAutomation; 