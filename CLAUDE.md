# CLAUDE.md

Guidance for Claude Code when working on this repository.

## Project Overview

Tindart is an AI art marketplace with three main components:

1. **Flutter App** (`flutter/`) - Web frontend for minting, browsing, and verifying NFTs
2. **Backend API** (`backend/`) - Node.js/Express server handling watermarking, encryption, and IPFS
3. **Smart Contracts** (`contracts/`) - ERC-721 NFT contract with marketplace on Polygon

## Common Commands

### Flutter

```bash
cd flutter
flutter pub get          # Install dependencies
flutter run -d chrome    # Run in browser
flutter test             # Run tests
flutter analyze          # Static analysis
dart format .            # Format code
```

### Backend

```bash
cd backend
npm install              # Install dependencies
npm run dev              # Run with nodemon
npm start                # Run production
npm test                 # Run Jest tests
```

### Contracts

```bash
cd contracts
npm install              # Install dependencies
npm run compile          # Compile contracts
npm test                 # Run Hardhat tests
npm run node             # Start local node
npm run deploy:local     # Deploy to local node
npm run deploy:mumbai    # Deploy to Polygon testnet
npm run deploy:polygon   # Deploy to Polygon mainnet
```

## Architecture

### Flutter App Structure

```
flutter/lib/
├── main.dart           # App entry, providers setup
├── router.dart         # GoRouter configuration
├── theme.dart          # Light/dark theme definitions
├── models/             # Data models (Token)
├── pages/              # Screen widgets
│   ├── home_page.dart
│   ├── mint_page.dart
│   ├── gallery_page.dart
│   ├── token_detail_page.dart
│   └── verify_page.dart
├── providers/          # State management (Provider)
│   ├── wallet_provider.dart   # Wallet connection state
│   └── mint_provider.dart     # Minting flow state
├── services/           # API communication
│   └── api_service.dart
└── widgets/            # Reusable components
    └── wallet_button.dart
```

### Backend Structure

```
backend/src/
├── index.js            # Express app setup
├── middleware/         # Auth, validation
├── routes/             # API endpoints
└── services/           # Business logic
    ├── watermark.js    # Watermark embedding/detection
    ├── encryption.js   # AES encryption for originals
    ├── ipfs.js         # Pinata IPFS uploads
    ├── kms.js          # Google Cloud KMS key management
    └── blockchain.js   # Contract interactions
```

### Smart Contract

`contracts/TindartNFT.sol`:
- Inherits: ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard
- License types: Display (0), Commercial (1), Transfer (2)
- Built-in marketplace with list/delist/buy
- 2.5% royalty to creator, 2.5% platform fee
- Duplicate prevention via imageHash mapping

## Key Patterns

### State Management (Flutter)

Uses Provider with ChangeNotifierProxyProvider for dependent providers:
- `WalletProvider`: Manages wallet connection state
- `MintProvider`: Depends on WalletProvider for minting operations

### API Authentication

Backend uses SIWE (Sign-In with Ethereum) for wallet authentication.

### License Types

```dart
enum LicenseType { display, commercial, transfer }
```

```solidity
enum LicenseType { Display, Commercial, Transfer }
```

## Testing

### Flutter Tests

Located in `flutter/test/`. Run with:
```bash
cd flutter && flutter test
```

### Backend Tests

Uses Jest. Located alongside source or in `__tests__/`. Run with:
```bash
cd backend && npm test
```

### Contract Tests

Uses Hardhat + Chai. Located in `contracts/test/`. Run with:
```bash
cd contracts && npm test
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Detects which components changed
- Runs tests only for changed components
- Flutter: format check, analyze, test
- Backend: npm test
- Contracts: compile, test

## Environment Setup

### Backend requires:

1. Firebase Admin SDK service account
2. Google Cloud KMS key ring and key
3. Pinata API credentials
4. Deployed contract address

### Contracts require:

1. Private key with MATIC for gas
2. RPC URLs (Alchemy/Infura)
3. Polygonscan API key (for verification)

## File Conventions

- Flutter: Standard Flutter/Dart conventions
- Backend: CommonJS modules, camelCase
- Contracts: Solidity style guide, custom errors over require strings

## Important Notes

- Watermark engine is external C++ (referenced but not in this repo)
- Encrypted originals stored on IPFS, keys in Cloud KMS
- Contract uses OpenZeppelin v5.0 base contracts
- Platform wallet receives 2.5% of marketplace sales
