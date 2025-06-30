# Background Agent v2.0

Background agent with Worker Threads support for periodic console message output.

## ✨ New Features v2.0

- 🧵 **Worker Threads** - agent runs in a separate thread
- 🔄 **Multithreading** - main thread remains free
- 📡 **Inter-thread communication** - message exchange between threads
- 🎛️ **Extended management** - commands for worker control

## Architecture

```
Main Thread (agent.js)
├── BackgroundAgentManager
└── Worker Thread (worker.js)
    └── BackgroundWorker
```

## Installation and Launch

### Requirements
- Node.js (version 12 or higher with Worker Threads support)

### Starting the agent
```bash
# Normal launch
npm start

# Or directly via node
node agent.js

# Test worker separately
npm run test
```

### Background launch (Unix/Linux/macOS)
```bash
# Background launch with log saving
nohup npm start > agent.log 2>&1 &

# Or using screen
screen -S background-agent npm start

# Or using pm2 (if installed)
pm2 start agent.js --name "background-agent"
```

## Features

- ✅ **Worker Threads** - execution in a separate thread
- ✅ Periodic output of "VLOG: hello from background" message
- ✅ Display Worker ID and uptime
- ✅ Correct handling of termination signals (Ctrl+C)
- ✅ Configurable interval between messages
- ✅ Inter-thread communication via message passing
- ✅ Automatic worker lifecycle management

## Project Files

- `agent.js` - main file with agent manager
- `worker.js` - worker thread with background agent logic
- `package.json` - project configuration
- `README.md` - documentation

## Configuration

By default, the agent outputs messages every 3 seconds. To change the interval, edit the `agent.js` file:

```javascript
const agentManager = new BackgroundAgentManager(5000); // 5 seconds
```

## Stopping the agent

- In interactive mode: `Ctrl+C`
- If running in background: find the process PID and terminate it
  ```bash
  ps aux | grep node
  kill [PID]
  ```

## Example Output

```
VLOG: Starting background agent in separate thread...
VLOG: Background worker started in separate thread
VLOG: hello from background
VLOG: hello from background [Worker ID: 12345, Uptime: 3s]
VLOG: hello from background [Worker ID: 12345, Uptime: 6s]
...
```

## API

### BackgroundAgentManager

```javascript
const agent = new BackgroundAgentManager(interval);

// Start
agent.start();

// Stop
agent.stop();

// Change interval
agent.setInterval(5000);

// Send command to worker
agent.sendCommand('customCommand', { data: 'value' });

// Get status
const status = agent.getStatus();
```

## Worker Threads Advantages

1. **Non-blocking execution** - main thread remains responsive
2. **Isolation** - worker runs in isolated context
3. **Scalability** - ability to create multiple workers
4. **Stability** - worker crash doesn't affect main thread 