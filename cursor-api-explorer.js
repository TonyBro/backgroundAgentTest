// Этот скрипт запускается в DevTools консоли Cursor для исследования API

class CursorAPIExplorer {
  constructor() {
    this.foundFunctions = [];
    this.foundObjects = [];
  }

  // Глубокий поиск функций, связанных с чатом
  searchChatFunctions(obj = window, path = 'window', depth = 0, maxDepth = 3) {
    if (depth > maxDepth || !obj || typeof obj !== 'object') return;
    
    try {
      Object.keys(obj).forEach(key => {
        try {
          const value = obj[key];
          const currentPath = `${path}.${key}`;
          
          // Поиск функций
          if (typeof value === 'function') {
            const funcName = key.toLowerCase();
            if (funcName.includes('send') || 
                funcName.includes('post') ||
                funcName.includes('chat') || 
                funcName.includes('message') ||
                funcName.includes('input') ||
                funcName.includes('submit')) {
              this.foundFunctions.push({
                path: currentPath,
                name: key,
                func: value,
                toString: value.toString().substring(0, 200) + '...'
              });
            }
          }
          
          // Поиск объектов
          if (typeof value === 'object' && value !== null) {
            const objName = key.toLowerCase();
            if (objName.includes('chat') || 
                objName.includes('ai') || 
                objName.includes('llm') ||
                objName.includes('editor') ||
                objName.includes('input') ||
                objName.includes('message')) {
              this.foundObjects.push({
                path: currentPath,
                name: key,
                obj: value,
                keys: Object.keys(value).slice(0, 10)
              });
              
              // Рекурсивный поиск
              this.searchChatFunctions(value, currentPath, depth + 1, maxDepth);
            }
          }
        } catch (e) {
          // Игнорируем ошибки доступа к свойствам
        }
      });
    } catch (e) {
      console.warn(`Ошибка при исследовании ${path}:`, e.message);
    }
  }

  // Поиск в прототипах и специальных объектах
  searchSpecialObjects() {
    const specialPaths = [
      'window.vscode',
      'window.cursor',
      'window.__cursor__',
      'window.electron',
      'window.require',
      'window.process',
      'window.global',
      'document.body.__vue__',
      'document.body.__react__',
      'window.Vue',
      'window.React'
    ];

    specialPaths.forEach(path => {
      try {
        const obj = eval(path);
        if (obj) {
          console.log(`Найден объект: ${path}`, obj);
          this.searchChatFunctions(obj, path, 0, 2);
        }
      } catch (e) {
        // Объект не существует
      }
    });
  }

  // Поиск Event Listeners на документе
  findEventListeners() {
    const events = ['keydown', 'keyup', 'click', 'input', 'submit'];
    events.forEach(eventType => {
      const listeners = getEventListeners ? getEventListeners(document)[eventType] : [];
      if (listeners && listeners.length > 0) {
        console.log(`Event listeners для ${eventType}:`, listeners);
      }
    });
  }

  // Анализ DOM для поиска элементов чата
  analyzeChatDOM() {
    const chatSelectors = [
      '[class*="chat"]',
      '[class*="message"]',
      '[class*="input"]',
      '[id*="chat"]',
      '[id*="message"]',
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]'
    ];

    const chatElements = [];
    chatSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          chatElements.push({
            selector,
            element: el,
            classes: el.className,
            id: el.id,
            tagName: el.tagName
          });
        });
      } catch (e) {
        // Игнорируем неверные селекторы
      }
    });

    return chatElements;
  }

  // Тестирование найденных функций
  testFunction(funcInfo, testMessage = "Тестовое сообщение") {
    console.log(`Тестируем функцию: ${funcInfo.path}`);
    
    try {
      // Различные способы вызова
      const attempts = [
        () => funcInfo.func(testMessage),
        () => funcInfo.func({ message: testMessage }),
        () => funcInfo.func({ content: testMessage }),
        () => funcInfo.func({ text: testMessage }),
        () => funcInfo.func({ type: 'message', content: testMessage })
      ];

      attempts.forEach((attempt, index) => {
        try {
          const result = attempt();
          console.log(`Попытка ${index + 1} для ${funcInfo.path}:`, result);
        } catch (e) {
          console.log(`Попытка ${index + 1} для ${funcInfo.path} не удалась:`, e.message);
        }
      });
    } catch (e) {
      console.error(`Ошибка тестирования ${funcInfo.path}:`, e);
    }
  }

  // Основной метод исследования
  explore() {
    console.log('🔍 Начинаем исследование Cursor API...');
    
    // Очищаем предыдущие результаты
    this.foundFunctions = [];
    this.foundObjects = [];
    
    // Поиск в основном объекте window
    this.searchChatFunctions();
    
    // Поиск в специальных объектах
    this.searchSpecialObjects();
    
    // Анализ DOM
    const chatElements = this.analyzeChatDOM();
    
    // Поиск Event Listeners
    this.findEventListeners();
    
    // Выводим результаты
    console.log('\n📋 РЕЗУЛЬТАТЫ ИССЛЕДОВАНИЯ:');
    console.log('\n🔧 Найденные функции:');
    this.foundFunctions.forEach((func, index) => {
      console.log(`${index + 1}. ${func.path}`);
      console.log(`   Код: ${func.toString}`);
    });
    
    console.log('\n📦 Найденные объекты:');
    this.foundObjects.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.path}`);
      console.log(`   Ключи: [${obj.keys.join(', ')}]`);
    });
    
    console.log('\n🎯 Элементы чата в DOM:');
    chatElements.forEach((el, index) => {
      console.log(`${index + 1}. ${el.tagName} (${el.selector})`);
      console.log(`   ID: ${el.id}, Classes: ${el.classes}`);
    });
    
    return {
      functions: this.foundFunctions,
      objects: this.foundObjects,
      domElements: chatElements
    };
  }

  // Автоматическое тестирование всех найденных функций
  testAllFunctions(testMessage = "🤖 Тест от агента") {
    console.log('\n🧪 Тестируем все найденные функции...');
    
    this.foundFunctions.forEach(func => {
      this.testFunction(func, testMessage);
    });
  }
}

// Создаем экземпляр и запускаем исследование
const explorer = new CursorAPIExplorer();
const results = explorer.explore();

// Делаем объект доступным глобально для дальнейшего использования
window.cursorExplorer = explorer;

console.log('\n✅ Исследование завершено!');
console.log('💡 Используй window.cursorExplorer.testAllFunctions() для тестирования найденных функций');
console.log('💡 Используй window.cursorExplorer.testFunction(функция, "сообщение") для тестирования конкретной функции');

// Возвращаем результаты
results; 