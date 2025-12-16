# Agent Dashboard

Real-time agent monitoring dashboard built with React, TypeScript, and Socket.IO.

## Features

- 🔴 Real-time agent status updates via WebSocket
- 📊 Live statistics dashboard
- ⏱️ Live call duration timers
- 🎨 Status-based color coding
- 📱 Responsive design (mobile, tablet, desktop)
- 🔔 Toast notifications for events
- 🔄 Auto-reconnection on disconnect

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time WebSocket communication

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

The dashboard connects to the Agent API server at:
```
http://10.0.3.230:3100
```

To change this, edit `src/hooks/useAgentSocket.ts` and update the `SERVER_URL` constant.

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main container
│   ├── Header.tsx       # Header with connection status
│   ├── SummaryStats.tsx # Statistics cards
│   ├── AgentGrid.tsx    # Agent cards grid
│   ├── AgentCard.tsx    # Individual agent card
│   ├── ConnectionStatus.tsx
│   ├── QueuePlaceholder.tsx
│   └── Notification.tsx # Toast notifications
├── hooks/               # Custom React hooks
│   ├── useAgentSocket.ts  # Socket.IO integration
│   ├── useCallTimer.ts    # Live call timer
│   └── useTimeAgo.ts      # Relative time formatting
├── types/
│   └── agent.ts         # TypeScript interfaces
├── utils/
│   └── formatters.ts    # Utility functions
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

## WebSocket Events

The dashboard listens to these events from the server:

- `agents:initial` - Initial agent list on connection
- `agent:registered` - New agent logged in
- `agent:status-changed` - Agent status changed
- `agent:call-started` - Agent started a call
- `agent:call-ended` - Agent ended a call

## License

MIT
