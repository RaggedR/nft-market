# Tindart

AI art marketplace with verifiable provenance, watermark-based authentication, and clear copyright licensing.

## Overview

Tindart combines invisible watermarking, NFT minting, and legal licensing into a single transaction. Artists can protect their work while buyers receive clear legal rights.

### Key Features

- **Watermark Verification**: Invisible watermarks embedded in images survive print-and-scan
- **NFT Provenance**: ERC-721 tokens on Polygon with on-chain license terms
- **Clear Licensing**: Three license tiers (Display, Commercial, Transfer)
- **Duplicate Detection**: Perceptual hashing prevents stolen art from being minted
- **Encrypted Originals**: High-res originals stored encrypted on IPFS

## Architecture

```
tindart/
├── flutter/        # Flutter web frontend
├── backend/        # Node.js API (Express)
└── contracts/      # Solidity smart contracts (Hardhat)
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Flutter Web |
| Backend | Node.js + Express |
| Blockchain | Polygon (ERC-721) |
| Storage | IPFS (Pinata) + Firestore |
| Key Management | Google Cloud KMS |
| Wallet | WalletConnect / MetaMask |

## Getting Started

### Prerequisites

- Flutter SDK (>=3.0.0)
- Node.js (>=20)
- A Polygon wallet with testnet MATIC

### Flutter App

```bash
cd flutter
flutter pub get
flutter run -d chrome
```

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### Smart Contracts

```bash
cd contracts
cp .env.example .env
# Edit .env with your private key and RPC URL
npm install
npm run compile
npm run test
npm run deploy:mumbai  # Deploy to testnet
```

## License Types

| Type | Rights | Base Price |
|------|--------|------------|
| Display | Personal display, resale of NFT | $1 |
| Commercial | Monetization, merchandise, derivatives | $5 |
| Transfer | Full copyright transfer | $10 |

## Development

### Running Tests

```bash
# Flutter
cd flutter && flutter test

# Backend
cd backend && npm test

# Contracts
cd contracts && npm test
```

### CI/CD

GitHub Actions runs on push/PR to `main` and `develop`:
- Flutter: format, analyze, test
- Backend: npm test
- Contracts: compile, test

## Environment Variables

### Backend (.env)

See `backend/.env.example` for required variables:
- Firebase Admin SDK credentials
- Google Cloud KMS configuration
- Pinata API keys
- Contract addresses

### Contracts (.env)

See `contracts/.env.example` for required variables:
- Private key for deployment
- RPC URLs for Polygon networks
- Polygonscan API key for verification

## License

MIT
