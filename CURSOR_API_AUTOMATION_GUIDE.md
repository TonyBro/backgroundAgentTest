# 🤖 Автоматизация Cursor IDE через DevTools API

Это руководство покажет, как настроить автоматическую отправку сообщений в чат Cursor IDE из внешних агентов, используя реверс-инжиниринг внутреннего API через DevTools.

## 🎯 Цель

Создать систему, где:
1. **Агент 1** отправляет сообщение через WebSocket
2. **Агент 2** (в Cursor IDE) автоматически получает это сообщение и отправляет его в LLM чат
3. Всё работает без эмуляции клавиш и ручного ввода

## 📋 Что включено

- `cursor-api-explorer.js` - Скрипт для исследования внутреннего API Cursor
- `cursor-devtools-automation.js` - Основной сервер автоматизации 
- `cursor-websocket-client.js` - Клиент для отправки сообщений от других агентов
- Полная документация и инструкции

## 🚀 Пошаговое руководство

### Шаг 1: Исследование API Cursor

1. **Открой DevTools в Cursor IDE:**
   ```
   Ctrl+Shift+I (Windows/Linux) или Cmd+Option+I (macOS)
   ```

2. **Скопируй и вставь содержимое `cursor-api-explorer.js` в консоль DevTools**

3. **Исследуй результаты:**
   ```javascript
   // Автоматически найдёт функции и объекты, связанные с чатом
   window.cursorExplorer.testAllFunctions("Тест от агента");
   ```

4. **Запиши найденные рабочие функции** - они будут использоваться в автоматизации

### Шаг 2: Включение Remote Debugging в Cursor

Cursor нужно запустить с поддержкой remote debugging:

#### macOS:
```bash
# Закрой Cursor полностью
# Запусти из терминала с debugging портом:
/Applications/Cursor.app/Contents/MacOS/Cursor --remote-debugging-port=9222
```

#### Windows:
```bash
# Закрой Cursor полностью
# Запусти из командной строки:
"C:\Users\%USERNAME%\AppData\Local\Programs\cursor\Cursor.exe" --remote-debugging-port=9222
```

#### Linux:
```bash
# Закрой Cursor полностью
# Запусти с debugging портом:
cursor --remote-debugging-port=9222
```

### Шаг 3: Настройка автоматизации

1. **Установи зависимости:**
   ```bash
   npm install
   ```

2. **Отредактируй `cursor-devtools-automation.js`:**
   
   Найди строки около 42-55 и замени на реальные функции, найденные на шаге 1:
   ```javascript
   // ЗАМЕНИ ЭТИ СТРОКИ НА РЕАЛЬНЫЕ ФУНКЦИИ ИЗ cursor-api-explorer.js:
   if (window.cursorAPI && window.cursorAPI.chat) {
     window.cursorAPI.chat.sendMessage(message);
   } else if (window.vscode && window.vscode.postMessage) {
     window.vscode.postMessage({
       type: 'chat-message',
       content: message
     });
   }
   ```

### Шаг 4: Запуск системы

1. **Запусти сервер автоматизации:**
   ```bash
   node cursor-devtools-automation.js
   ```

2. **В другом терминале, запусти клиент для тестирования:**
   ```bash
   # Отправить одно сообщение:
   node cursor-websocket-client.js "Привет от агента!"
   
   # Интерактивный режим:
   node cursor-websocket-client.js --interactive
   
   # Автоматические тесты:
   node cursor-websocket-client.js --test
   ```

## 🔧 Альтернативные подходы

### Если DevTools Protocol не работает:

1. **DOM-based подход** (добавь в `injectChatFunction`):
   ```javascript
   // Найти textarea чата и вставить текст
   const chatInput = document.querySelector('textarea[placeholder*="chat"]') || 
                     document.querySelector('[contenteditable="true"]');
   if (chatInput) {
     chatInput.value = message;
     chatInput.dispatchEvent(new Event('input', { bubbles: true }));
     
     // Эмулировать Enter
     chatInput.dispatchEvent(new KeyboardEvent('keydown', {
       key: 'Enter',
       bubbles: true
     }));
   }
   ```

2. **Event-based подход**:
   ```javascript
   // Использовать события для отправки
   window.dispatchEvent(new CustomEvent('cursor-send-message', {
     detail: { message: message }
   }));
   ```

## 🎮 Использование в проекте

### Интеграция с существующими агентами:

```javascript
const CursorWebSocketClient = require('./cursor-websocket-client.js');

class AgentWithCursorIntegration {
  constructor() {
    this.cursorClient = new CursorWebSocketClient();
  }
  
  async start() {
    await this.cursorClient.connect();
  }
  
  async sendToCursor(message) {
    return this.cursorClient.sendMessage(message);
  }
}
```

### Автоматическая пересылка между агентами:

```javascript
// Агент 1 отправляет результат в Cursor для Агента 2
const result = await processTask(task);
await cursorClient.sendMessage(`Обработай этот результат: ${result}`);
```

## 🛠️ Настройка и отладка

### Логирование:
Все действия логируются в консоль. Для детальной отладки добавь:
```javascript
// В cursor-devtools-automation.js
console.log('DEBUG: Trying to send message:', message);
```

### Проверка подключения к Cursor:
```bash
# Проверь, что Cursor доступен по debugging порту:
curl http://localhost:9222/json
```

### Частые проблемы:

1. **"Не удалось подключиться к Cursor"**
   - Убедись, что Cursor запущен с `--remote-debugging-port=9222`
   - Проверь, что порт 9222 свободен

2. **"Функция отправки не найдена"**
   - Повтори исследование API с `cursor-api-explorer.js`
   - Cursor мог обновиться и изменить внутреннюю структуру

3. **"WebSocket connection failed"**
   - Убедись, что автоматизация запущена и слушает порт 3001
   - Проверь firewall настройки

## 📚 Дополнительная информация

### Структура сообщений WebSocket:
```json
{
  "type": "chat-message",
  "content": "Текст сообщения",
  "timestamp": 1640995200000,
  "from": "agent-client"
}
```

### Кастомизация портов:
```javascript
// В cursor-devtools-automation.js измени:
const debuggingPort = 9222; // Debugging порт Cursor
// В startWebSocketServer измени:
this.startWebSocketServer(3001); // WebSocket порт

// В cursor-websocket-client.js измени:
const url = 'ws://localhost:3001'; // URL WebSocket сервера
```

---

## ⚠️ Важные заметки

- Это решение использует внутренние API Cursor, которые могут измениться
- Тестировалось на Cursor версии [указать версию]
- Для production использования рекомендуется мониторинг и error handling
- Соблюдай Terms of Service Cursor при использовании

## 🤝 Поддержка

Если что-то не работает:
1. Запусти `cursor-api-explorer.js` заново для поиска новых функций
2. Проверь логи в DevTools консоли Cursor
3. Убедись, что все зависимости установлены: `npm install`

**Удачи с автоматизацией! 🚀** 