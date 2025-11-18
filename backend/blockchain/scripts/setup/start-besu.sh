#!/bin/bash

echo "========================================"
echo "Starting Hyperledger Besu PoA Network"
echo "========================================"
echo ""

# Get the script directory and navigate to backend root
cd "$(dirname "$0")/../../.."

# Check if Besu is installed
if ! command -v besu &> /dev/null; then
    echo "ERROR: Besu is not installed or not in PATH"
    echo "Please install Besu first or add it to your PATH"
    echo "Download from: https://github.com/hyperledger/besu/releases"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p blockchain/data

# Check if genesis file exists
if [ ! -f "blockchain/config/genesis.json" ]; then
    echo "ERROR: genesis.json not found in blockchain/config directory"
    exit 1
fi

echo "Network Configuration:"
echo "  - Network ID: 1337"
echo "  - Chain ID: 1337"
echo "  - Consensus: Clique (Proof of Authority)"
echo "  - Block Period: 5 seconds"
echo "  - RPC Endpoint: http://localhost:8545"
echo "  - WebSocket: ws://localhost:8546"
echo "  - Data Directory: blockchain/data"
echo ""

echo "Starting Besu node..."
echo "Press Ctrl+C to stop the node"
echo ""

# Start Besu with PoA configuration
besu \
    --data-path=./blockchain/data \
    --genesis-file=./blockchain/config/genesis.json \
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

