const WebSocket = require('ws');
const readline = require('readline');

class CursorWebSocketClient {
  constructor(url = 'ws://localhost:3001') {
    this.url = url;
    this.ws = null;
    this.rl = null;
  }

  // Подключение к WebSocket серверу
  connect() {
    return new Promise((resolve, reject) => {
      console.log(`Подключаемся к ${this.url}...`);
      
      this.ws = new WebSocket(this.url);
      
      this.ws.on('open', () => {
        console.log('✅ Подключен к серверу автоматизации Cursor');
        resolve();
      });
      
      this.ws.on('error', (error) => {
        console.error('❌ Ошибка подключения:', error.message);
        reject(error);
      });
      
      this.ws.on('close', () => {
        console.log('🔌 Соединение закрыто');
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📥 Получен ответ от сервера:', message);
        } catch (e) {
          console.log('📥 Получено сообщение:', data.toString());
        }
      });
    });
  }

  // Отправка сообщения в чат Cursor
  sendMessage(content) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Нет подключения к серверу');
      return false;
    }

    const message = {
      type: 'chat-message',
      content: content,
      timestamp: Date.now(),
      from: 'agent-client'
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Сообщение отправлено:', content);
      return true;
    } catch (error) {
      console.error('❌ Ошибка отправки:', error.message);
      return false;
    }
  }

  // Интерактивный режим для тестирования
  startInteractiveMode() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🎮 Интерактивный режим запущен!');
    console.log('💡 Введите сообщение для отправки в Cursor чат (или "exit" для выхода):');
    
    const promptUser = () => {
      this.rl.question('\n> ', (input) => {
        if (input.toLowerCase() === 'exit') {
          this.close();
          return;
        }
        
        if (input.trim()) {
          this.sendMessage(input);
        }
        
        promptUser();
      });
    };
    
    promptUser();
  }

  // Закрытие соединения
  close() {
    if (this.rl) {
      this.rl.close();
    }
    if (this.ws) {
      this.ws.close();
    }
    console.log('👋 До свидания!');
  }

  // Отправка нескольких тестовых сообщений
  async sendTestMessages() {
    const testMessages = [
      "Привет! Это тестовое сообщение от агента 1",
      "Проверяем автоматическую отправку сообщений",
      "Создай новый React компонент для отображения списка пользователей",
      "Какие есть лучшие практики для оптимизации производительности в Node.js?",
      "Помоги с отладкой этой функции"
    ];

    console.log('\n🧪 Отправляем тестовые сообщения...');
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n📝 Тест ${i + 1}/${testMessages.length}:`);
      this.sendMessage(message);
      
      // Ждём секунду между сообщениями
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Все тестовые сообщения отправлены!');
  }
}

// Функция для демонстрации использования
async function demo() {
  const client = new CursorWebSocketClient();
  
  try {
    await client.connect();
    
    // Выбор режима работы
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
      // Режим автоматического тестирования
      await client.sendTestMessages();
      setTimeout(() => client.close(), 2000);
    } else if (args.includes('--interactive')) {
      // Интерактивный режим
      client.startInteractiveMode();
    } else {
      // Отправка одного сообщения
      const message = args.join(' ') || 'Тестовое сообщение от агента';
      client.sendMessage(message);
      setTimeout(() => client.close(), 1000);
    }
    
  } catch (error) {
    console.error('❌ Ошибка запуска клиента:', error.message);
    process.exit(1);
  }
}

// Обработка сигнала завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

// Если файл запущен напрямую
if (require.main === module) {
  console.log('🚀 Запуск WebSocket клиента для Cursor...');
  console.log('💡 Использование:');
  console.log('   node cursor-websocket-client.js "Привет от агента"');
  console.log('   node cursor-websocket-client.js --interactive');
  console.log('   node cursor-websocket-client.js --test');
  console.log('');
  
  demo();
}

module.exports = CursorWebSocketClient; 