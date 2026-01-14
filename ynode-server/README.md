# ynode-server

Backend API for ynode workflow automation.

## Tech Stack

- **Framework**: Express.js + TypeScript
- **Database**: SQLite (via `better-sqlite3`)
- **Real-time**: WebSocket (`ws`)
- **Security**: Argon2, AES-256-GCM encryption

## Environment

Copy `.env.example` to `.env` and configure the following:

- `JWT_SECRET`: used for signing authentication tokens (optional).
- `CREDENTIAL_ENCRYPTION_KEY`: used to encrypt/decrypt sensitive node data like sk-ai, api keys, etc (required).
- `PORT`: server port (default: 3001).
- `CORS_ORIGINS`: allowed frontend origins (default: http://localhost:5173,http://localhost:4173).
