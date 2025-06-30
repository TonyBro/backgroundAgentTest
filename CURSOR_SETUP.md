# Cursor Background Agent Setup

Инструкция по настройке и запуску Background Agent в системе Cursor.

## 📋 Что такое Cursor Background Agent

Cursor Background Agent - это асинхронный удаленный агент, который может редактировать и запускать ваш код в изолированной виртуальной машине. Агент работает в фоне и может выполнять задачи независимо от вашего локального окружения.

## 🚀 Быстрый старт

### 1. Настройка репозитория

Убедитесь, что ваш проект находится в Git репозитории на GitHub, так как Cursor Background Agent клонирует код из GitHub.

```bash
# Если репозиторий еще не создан:
git init
git add .
git commit -m "Initial commit for Cursor Background Agent"
git remote add origin https://github.com/username/your-repo.git
git push -u origin main
```

### 2. Запуск Background Agent

1. **Откройте Cursor Background Agent панель**: `Ctrl+E` (или `Cmd+E` на Mac)
2. **Создайте новый агент**: Нажмите кнопку создания нового агента
3. **Отправьте задачу**: Введите что-то вроде "Запусти background agent для логирования VLOG сообщений"

### 3. Проверка работы

Agent автоматически:
- Клонирует ваш репозиторий
- Запустит `npm install` (команда install из environment.json)
- Запустит терминалы с Background VLOG Agent и Status Monitor

## 📁 Структура проекта

```
backgroundAgent/
├── .cursor/
│   └── environment.json     # Конфигурация Cursor Background Agent
├── agent.js                 # Локальная версия с Worker Threads
├── cursor-agent.js          # Версия для Cursor Background Agent
├── worker.js               # Worker Thread для локальной версии
├── example.js              # Пример использования
├── package.json            # Зависимости Node.js
├── README.md               # Основная документация
└── CURSOR_SETUP.md         # Эта инструкция
```

## ⚙️ Конфигурация environment.json

Файл `.cursor/environment.json` содержит настройки для Cursor Background Agent:

```json
{
  "install": "npm install",
  "start": "echo '🚀 Cursor Background Agent environment готова к работе'",
  "terminals": [
    {
      "name": "Background VLOG Agent",
      "command": "node cursor-agent.js"
    },
    {
      "name": "Status Monitor",
      "command": "echo '📊 Monitoring Background Agent Status...' && sleep 5 && while true; do echo '--- Agent Status Check ---' && ps aux | grep 'node cursor-agent.js' | grep -v grep && sleep 30; done"
    }
  ]
}
```

### Описание параметров:

- **install**: Команда для установки зависимостей (выполняется при каждом старте)
- **start**: Команда инициализации среды
- **terminals**: Массив терминалов, которые будут запущены в tmux сессии

## 🔧 Настройки агента

Вы можете настроить поведение агента через переменные окружения:

```bash
# Изменить интервал логирования (в миллисекундах)
export AGENT_INTERVAL=5000

# Запустить агент с новым интервалом
node cursor-agent.js
```

## 📊 Мониторинг агента

### Встроенные команды

Agent поддерживает сигналы для управления:

```bash
# Показать статус (отправить SIGUSR1)
kill -USR1 <PID>

# Изменить интервал (отправить SIGUSR2)
kill -USR2 <PID>

# Остановить агент (отправить SIGTERM)
kill -TERM <PID>
```

### Логи агента

Agent выводит детальные логи с временными метками:

```
[2024-01-15T10:30:00.000Z] VLOG: 🚀 Cursor Background Agent запущен в удаленной среде
[2024-01-15T10:30:00.001Z] VLOG: Session ID: abc123def456
[2024-01-15T10:30:00.002Z] VLOG: привет из бэкграунда
[2024-01-15T10:30:00.003Z] VLOG: 🖥️  Hostname: cursor-vm-12345
[2024-01-15T10:30:00.004Z] VLOG: 🐧 Platform: linux x64
```

## 🔐 Безопасность

При использовании Cursor Background Agent учитывайте:

1. **GitHub доступ**: Нужны права read-write на репозиторий
2. **Изолированная среда**: Код выполняется в изолированной Ubuntu VM
3. **Интернет доступ**: Agent имеет доступ к интернету
4. **Auto-run команды**: Agent автоматически выполняет команды (риск инъекций)

## 🐛 Отладка

### Проверка статуса в Cursor

1. Откройте панель Background Agent (`Ctrl+E`)
2. Выберите ваш агент из списка
3. Просмотрите логи и статус выполнения

### Локальное тестирование

Перед отправкой в Background Agent, протестируйте локально:

```bash
# Тест основного агента
node cursor-agent.js

# Тест Worker Threads версии
node agent.js

# Тест примера использования
node example.js
```

## 📚 Дополнительные ресурсы

- [Официальная документация Cursor Background Agents](https://docs.cursor.com/background-agent)
- [Cursor Discord #background-agent канал](https://discord.gg/cursor)
- Email: background-agent-feedback@cursor.com

## 🎯 Примеры задач для Background Agent

Примеры промптов для Cursor Background Agent:

1. **"Запусти background agent и следи за логами VLOG"**
2. **"Проверь работу агента и покажи статистику"**
3. **"Измени интервал логирования на 1 секунду"**
4. **"Добавь новую функциональность для мониторинга системы"**
5. **"Оптимизируй производительность агента"**

## ✅ Чек-лист готовности

Перед запуском Background Agent убедитесь:

- [ ] Проект в GitHub репозитории
- [ ] Файл `.cursor/environment.json` создан
- [ ] `package.json` содержит правильные зависимости
- [ ] Локальное тестирование прошло успешно
- [ ] Cursor Background Agent панель доступна (`Ctrl+E`)

Теперь ваш Background Agent готов к работе в системе Cursor! 🎉 