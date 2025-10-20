#!/bin/bash

echo "🚀 Setting up BlockCred with Real GoEth Blockchain..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go first."
    exit 1
fi

# Check if Geth is installed
if ! command -v geth &> /dev/null; then
    echo "❌ Geth is not installed. Please install Geth first."
    echo "   Download from: https://geth.ethereum.org/downloads/"
    exit 1
fi

# Check if Node.js is installed (for contract deployment)
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install Go dependencies
echo "📦 Installing Go dependencies..."
go mod tidy

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm init -y
npm install web3

# Create blockchain data directory
echo "📁 Creating blockchain data directory..."
mkdir -p blockchain-data/data

# Initialize GoEth blockchain
echo "🔧 Initializing GoEth blockchain..."
cd blockchain-data
geth --datadir ./data init ../genesis.json

# Create admin account
echo "👤 Creating admin account..."
echo "admin123" > password.txt
geth --datadir ./data account new --password password.txt

# Get admin address
ADMIN_ADDRESS=$(geth --datadir ./data account list | head -n 1 | cut -d'{' -f2 | cut -d'}' -f1)
echo "Admin address: $ADMIN_ADDRESS"

# Update genesis.json with admin address
cd ..
cat > genesis.json << EOF
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0
  },
  "alloc": {
    "$ADMIN_ADDRESS": {
      "balance": "1000000000000000000000"
    }
  },
  "coinbase": "0x0000000000000000000000000000000000000000",
  "difficulty": "0x400",
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0x8000000",
  "nonce": "0x0000000000000042",
  "mixhash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "timestamp": "0x00"
}
EOF

# Reinitialize with updated genesis
cd blockchain-data
geth --datadir ./data init ../genesis.json

# Start GoEth node in background
echo "🔄 Starting GoEth node..."
geth --datadir ./data --networkid 1337 --http --http.addr "0.0.0.0" --http.port 8545 --http.api "eth,net,web3,personal,admin" --http.corsdomain "*" --ws --ws.addr "0.0.0.0" --ws.port 8546 --ws.api "eth,net,web3,personal,admin" --ws.origins "*" --unlock $ADMIN_ADDRESS --password password.txt --mine --miner.threads 1 --miner.etherbase $ADMIN_ADDRESS &

# Wait for node to start
echo "⏳ Waiting for GoEth node to start..."
sleep 15

# Deploy smart contract
echo "📄 Deploying CredentialManager contract..."
cd ..
node deploy-contract.js

# Get contract address
if [ -f "contract-address.txt" ]; then
    CONTRACT_ADDRESS=$(cat contract-address.txt)
    echo "Contract deployed at: $CONTRACT_ADDRESS"
    
    # Create .env file
    cat > .env << EOF
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here
BLOCKCHAIN_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
SERVER_PORT=8080
CORS_ORIGINS=http://localhost:3000
EOF
    
    echo "✅ Environment configured!"
else
    echo "❌ Contract deployment failed"
    exit 1
fi

echo ""
echo "🎉 BlockCred blockchain setup completed!"
echo ""
echo "📊 Access your services:"
echo "   • BlockCred Backend: http://localhost:8080"
echo "   • GoEth RPC: http://localhost:8545"
echo "   • GoEth WebSocket: ws://localhost:8546"
echo "   • Admin Address: $ADMIN_ADDRESS"
echo "   • Contract Address: $CONTRACT_ADDRESS"
echo ""
echo "🔧 To start the backend:"
echo "   go run main.go"
echo ""
echo "⚠️  Note: You need to update BLOCKCHAIN_PRIVATE_KEY in .env with the actual private key"
