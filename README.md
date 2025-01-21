# Solana Agent Kit Telegram Private Bot

A powerful Telegram bot built with Next.js, created by Send Arcade and inspired by Solana Agent Kit by Send AI. This is the private bot version that's specifically designed for one-on-one interactions with users, providing a secure and personalized experience for managing Solana blockchain operations.

## Features

- 🤖 Private chat support for secure interactions
- 💼 Individual wallet management per user
- 📊 PostgreSQL database for chat history
- 🔥 Firebase integration for wallet storage
- ⚡ Concurrent user state management
- 🎯 Context-aware responses
- 🔐 Secure private key handling
- 🔒 End-to-end encrypted communications

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Firebase project
- Telegram Bot Token
- Solana RPC URL
- OpenAI API Key

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   Create a `.env` file with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   RPC_URL=your_solana_rpc_url
   SOLANA_PRIVATE_KEY=your_solana_private_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

4. **Start the development server**
   ```bash
   pnpm run dev
   ```

5. **Set up webhook**
   - Run ngrok to expose your local server:
     ```bash
     ngrok http 3000
     ```
   - Set the webhook using the ngrok URL:
     ```bash
     curl https://api.telegram.org/bot<telegram_bot_token>/setWebhook?url=https://<your-ngrok-url>/api/bot
     ```
   - Verify the webhook setup:
     ```json
     {"ok":true,"result":true,"description":"Webhook was set"}
     ```

## Bot Usage

The bot is specifically designed for private chats with the following features:

- Direct one-on-one interactions with users
- Secure handling of sensitive information
- Individual wallet management
- Personalized responses based on user context
- Private transaction handling
- Secure key management

## Deployment

The bot can be deployed on Vercel:

1. Push your code to GitHub
2. Import the project on Vercel
3. Configure environment variables
4. Deploy

## Getting a Telegram Bot Token

To create a new bot and get a token:
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use the `/newbot` command
3. Follow the instructions to create your bot
4. Save the provided token

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Send AI](https://sendai.fun) for the Solana Agent Kit inspiration
- [Send Arcade](https://sendarcade.fun) for creating this project
- [Next.js](https://nextjs.org) for the framework
- [Telegram Bot API](https://core.telegram.org/bots/api) for the bot functionality
