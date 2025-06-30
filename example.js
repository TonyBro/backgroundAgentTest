const BackgroundAgentManager = require('./agent.js');

// Example usage of background agent with worker threads
console.log('=== Background Agent v2.0 Usage Example ===\n');

// Create agent with 2 second interval
const agent = new BackgroundAgentManager(2000);

console.log('Status before start:', agent.getStatus());

// Start agent
agent.start();

// After 10 seconds change interval
setTimeout(() => {
    console.log('\n--- Changing interval to 1 second ---');
    agent.setInterval(1000);
}, 10000);

// After 20 seconds show status
setTimeout(() => {
    console.log('\n--- Current status ---');
    console.log(agent.getStatus());
}, 20000);

// After 30 seconds stop agent
setTimeout(() => {
    console.log('\n--- Stopping agent ---');
    agent.stop();
}, 30000); 