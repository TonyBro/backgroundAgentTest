/**
 * Тестовый WebSocket клиент для демонстрации работы с AI Background Agent
 * Использование: node test-websocket-client.js
 */

const WebSocket = require('ws');

async function testAIAgent() {
    console.log('🔗 Подключение к AI Background Agent...');
    
    const ws = new WebSocket('ws://localhost:3020');
    
    ws.on('open', () => {
        console.log('✅ Подключен к AI Agent через WebSocket');
        console.log('📤 Отправка тестовых инструкций...\n');
        
        // Последовательность тестовых инструкций
        const instructions = [
            'Проанализировать текущую папку проекта',
            'Подсчитать количество файлов в директории logs',
            'Создать краткий отчет о состоянии системы',
            'Выполнить финальную проверку готовности'
        ];
        
        // Отправляем инструкции с интервалом
        instructions.forEach((instruction, index) => {
            setTimeout(() => {
                console.log(`📤 Фаза ${index + 1}: ${instruction}`);
                ws.send(instruction);
            }, (index + 1) * 2000);
        });
        
        // Закрываем соединение через 10 секунд
        setTimeout(() => {
            console.log('\n🔌 Закрытие соединения...');
            ws.close();
        }, 10000);
    });
    
    ws.on('message', (data) => {
        try {
            const response = JSON.parse(data);
            console.log('📥 Ответ от AI Agent:', response);
        } catch (error) {
            console.log('📥 Ответ от AI Agent:', data.toString());
        }
        console.log(''); // Пустая строка для разделения
    });
    
    ws.on('close', () => {
        console.log('🔌 Соединение закрыто');
        process.exit(0);
    });
    
    ws.on('error', (error) => {
        console.error('❌ Ошибка WebSocket:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Убедитесь, что AI Background Agent запущен:');
            console.log('   npm run ai-agent');
        }
        
        process.exit(1);
    });
}

testAIAgent(); 