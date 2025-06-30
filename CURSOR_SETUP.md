# Cursor Background Agent Setup

Instructions for setting up and running Background Agent in Cursor system.

## 📋 What is Cursor Background Agent

Cursor Background Agent is an asynchronous remote agent that can edit and run your code in an isolated virtual machine. The agent works in the background and can perform tasks independently of your local environment.

## 🚀 Quick Start

### 1. Repository Setup

Make sure your project is in a Git repository on GitHub, as Cursor Background Agent clones code from GitHub.

```bash
# If repository is not created yet:
git init
git add .
git commit -m "Initial commit for Cursor Background Agent"
git remote add origin https://github.com/username/your-repo.git
git push -u origin main
```

### 2. Starting Background Agent

1. **Open Cursor Background Agent panel**: `Ctrl+E` (or `Cmd+E` on Mac)
2. **Create new agent**: Click the new agent creation button
3. **Send task**: Enter something like "Start background agent for VLOG message logging"

### 3. Checking Operation

Agent automatically:
- Clones your repository
- Runs `npm install` (install command from environment.json)
- Starts terminals with Background VLOG Agent and Status Monitor

## 📁 Project Structure

```
backgroundAgent/
├── .cursor/
│   └── environment.json     # Cursor Background Agent configuration
├── agent.js                 # Local version with Worker Threads
├── cursor-agent.js          # Version for Cursor Background Agent
├── worker.js               # Worker Thread for local version
├── example.js              # Usage example
├── package.json            # Node.js dependencies
├── README.md               # Main documentation
└── CURSOR_SETUP.md         # This instruction
```

## ⚙️ environment.json Configuration

The `.cursor/environment.json` file contains settings for Cursor Background Agent:

```json
{
  "install": "npm install",
  "start": "echo '🚀 Cursor Background Agent environment ready to work'",
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

### Parameter description:

- **install**: Command for dependency installation (executed on each start)
- **start**: Environment initialization command
- **terminals**: Array of terminals that will be started in tmux session

## 🔧 Agent Settings

You can configure agent behavior through environment variables:

```bash
# Change logging interval (in milliseconds)
export AGENT_INTERVAL=5000

# Start agent with new interval
node cursor-agent.js
```

## 📊 Agent Monitoring

### Built-in Commands

Agent supports signals for control:

```bash
# Show status (send SIGUSR1)
kill -USR1 <PID>

# Change interval (send SIGUSR2)
kill -USR2 <PID>

# Stop agent (send SIGTERM)
kill -TERM <PID>
```

### Agent Logs

Agent outputs detailed logs with timestamps:

```
[2024-01-15T10:30:00.000Z] VLOG: 🚀 Cursor Background Agent started in remote environment
[2024-01-15T10:30:00.001Z] VLOG: Session ID: abc123def456
[2024-01-15T10:30:00.002Z] VLOG: hello from background
[2024-01-15T10:30:00.003Z] VLOG: 🖥️  Hostname: cursor-vm-12345
[2024-01-15T10:30:00.004Z] VLOG: 🐧 Platform: linux x64
```

## 🔐 Security

When using Cursor Background Agent consider:

1. **GitHub access**: Need read-write permissions on repository
2. **Isolated environment**: Code runs in isolated Ubuntu VM
3. **Internet access**: Agent has internet access
4. **Auto-run commands**: Agent automatically executes commands (injection risk)

## 🐛 Debugging

### Status Check in Cursor

1. Open Background Agent panel (`Ctrl+E`)
2. Select your agent from the list
3. View logs and execution status

### Local Testing

Before sending to Background Agent, test locally:

```bash
# Test main agent
node cursor-agent.js

# Test Worker Threads version
node agent.js

# Test usage example
node example.js
```

## 📚 Additional Resources

- [Official Cursor Background Agents documentation](https://docs.cursor.com/background-agent)
- [Cursor Discord #background-agent channel](https://discord.gg/cursor)
- Email: background-agent-feedback@cursor.com

## 🎯 Task Examples for Background Agent

Example prompts for Cursor Background Agent:

1. **"Start background agent and monitor VLOG logs"**
2. **"Check agent operation and show statistics"**
3. **"Change logging interval to 1 second"**
4. **"Add new functionality for system monitoring"**
5. **"Optimize agent performance"**

## ✅ Readiness Checklist

Before starting Background Agent make sure:

- [ ] Project is in GitHub repository
- [ ] `.cursor/environment.json` file is created
- [ ] `package.json` contains correct dependencies
- [ ] Local testing passed successfully
- [ ] Cursor Background Agent panel is accessible (`Ctrl+E`)

Now your Background Agent is ready to work in Cursor system! 🎉 