# CGExtract

A personal desktop application for extracting and analyzing data from custom League of Legends games played with friends.

## Motivation

CGExtract was built to enhance the custom game experience I share with my friends by providing easy access to detailed match data and statistics. This tool allows us to review our games, track performance over time, and dive deeper into the gameplay patterns that emerge in our custom matches. It's specifically tailored to our group's needs and the types of analysis we find most valuable.

## Features

- **Real-time LCU Connection**: Automatic detection and connection to the League of Legends client
- **Custom Game Data**: Extract comprehensive data from our custom matches
- **Match Analysis**: Review detailed statistics and gameplay patterns from our games
- **Bulk Timeline Downloads**: Efficiently download multiple game timelines for deeper analysis
- **Personal Data Storage**: Secure storage and organization of match data
- **Friend Group Integration**: Tools designed around our specific gameplay and analysis needs

## Technologies

- **Frontend**: React + TypeScript for a modern, type-safe UI
- **Desktop Framework**: Electron for cross-platform desktop application
- **Build Tool**: Vite for fast development and optimized builds
- **Authentication**: Firebase Auth for personal data management
- **LCU Integration**: Direct communication with League Client API
- **Styling**: Custom CSS with modern design patterns

## Getting Started

1. **Prerequisites**: Ensure League of Legends client is installed
2. **Setup**: Clone and build the application locally
3. **Authentication**: Configure Firebase for personal use
4. **Connect**: Launch League client - CGExtract will automatically detect and connect

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Note

This is a personal project built for my specific use case and custom games with friends. It's not intended for public distribution or general use.
