const BackgroundAgentManager = require('./agent.js');

// Пример использования фонового агента с worker threads
console.log('=== Пример использования Background Agent v2.0 ===\n');

// Создаем агент с интервалом 2 секунды
const agent = new BackgroundAgentManager(2000);

console.log('Статус до запуска:', agent.getStatus());

// Запускаем агент
agent.start();

// Через 10 секунд изменим интервал
setTimeout(() => {
    console.log('\n--- Изменяем интервал на 1 секунду ---');
    agent.setInterval(1000);
}, 10000);

// Через 20 секунд покажем статус
setTimeout(() => {
    console.log('\n--- Текущий статус ---');
    console.log(agent.getStatus());
}, 20000);

// Через 30 секунд остановим агент
setTimeout(() => {
    console.log('\n--- Останавливаем агент ---');
    agent.stop();
}, 30000); 