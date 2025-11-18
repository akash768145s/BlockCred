# Hyperledger Besu PoA Network Setup

This guide explains how to set up and run a Proof of Authority (PoA) blockchain network using Hyperledger Besu.

## Prerequisites

- **Java 17+** (Besu requires Java 17 or higher)
- **Hyperledger Besu** installed and in your PATH

## Installation

### Windows

1. **Download Besu:**
   - Visit [Besu Releases](https://github.com/hyperledger/besu/releases)
   - Download the latest Windows release (e.g., `besu-24.1.0-windows.zip`)
   - Extract to a directory (e.g., `C:\besu`)

2. **Add to PATH:**
   - Add `C:\besu\besu-24.1.0\bin` to your system PATH
   - Or run the installation script: `.\install-besu.ps1`

3. **Verify Installation:**
   ```powershell
   besu --version
   ```

### Linux/macOS

```bash
# Using Homebrew (macOS)
brew install hyperledger/besu/besu

# Or download from releases
wget https://github.com/hyperledger/besu/releases/download/v24.1.0/besu-24.1.0.tar.gz
tar -xzf besu-24.1.0.tar.gz
export PATH=$PATH:$(pwd)/besu-24.1.0/bin
```

## Network Configuration

The PoA network is configured with:

- **Network ID**: 1337
- **Chain ID**: 1337
- **Consensus**: Clique (Proof of Authority)
- **Block Period**: 5 seconds
- **RPC HTTP**: http://localhost:8545
- **RPC WebSocket**: ws://localhost:8546
- **Validator Address**: `0x53b8be11aada878bbf830e426d5d3071c34facef`
- **Initial Balance**: 1,000,000 ETH

## Starting the Network

### Windows

```batch
cd backend
.\start-besu-blockchain.bat
```

### Linux/macOS

```bash
cd backend
./start-besu-blockchain.sh
```

Or manually:

```bash
besu \
    --data-path=./blockchain-data/data \
    --genesis-file=./blockchain-data/genesis.json \
    --network-id=1337 \
    --rpc-http-enabled \
    --rpc-http-api=ETH,NET,CLIQUE,ADMIN,MINER,DEBUG,TXPOOL,TRACE,IBFT,PERM,PLUGINS,WEB3 \
    --rpc-http-host=0.0.0.0 \
    --rpc-http-port=8545 \
    --rpc-http-cors-origins="*" \
    --rpc-ws-enabled \
    --rpc-ws-api=ETH,NET,CLIQUE,ADMIN,MINER,DEBUG,TXPOOL,TRACE,IBFT,PERM,PLUGINS,WEB3 \
    --rpc-ws-host=0.0.0.0 \
    --rpc-ws-port=8546 \
    --host-allowlist="*" \
    --miner-coinbase=53b8be11aada878bbf830e426d5d3071c34facef \
    --min-gas-price=0
```

## Verifying the Network

### Windows

```batch
.\check-besu-status.bat
```

### Using cURL

```bash
# Check block number
curl -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check network version
curl -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
```

## Genesis File

The `genesis.json` file defines:

- **Clique Configuration**: 5-second block period, 30000 epoch length
- **Validator**: Pre-configured validator address in `extraData`
- **Initial Allocation**: 1,000,000 ETH to the validator address

## Clique PoA Consensus

Clique is a Proof of Authority consensus algorithm where:

- **Validators**: Pre-approved nodes that can create blocks
- **Block Period**: Fixed time between blocks (5 seconds)
- **No Mining**: No computational work required
- **Fast Finality**: Blocks are finalized quickly

## Troubleshooting

### Port Already in Use

If port 8545 is already in use:

```bash
# Windows
netstat -ano | findstr :8545

# Linux/macOS
lsof -i :8545
```

Kill the process or change the port in the startup script.

### Java Version

Ensure Java 17+ is installed:

```bash
java -version
```

### Data Directory Issues

If you need to reset the blockchain:

```bash
# Delete the data directory
rm -rf blockchain-data/data

# Restart Besu (it will reinitialize from genesis)
```

## Connecting Your Application

Configure your backend to connect to the Besu node:

```env
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=<your-deployed-contract-address>
```

## Next Steps

1. Deploy the `CertificateManager.sol` contract
2. Update `CONTRACT_ADDRESS` in your `.env` file
3. Start issuing certificates on-chain!

