#!/bin/bash

echo "🚀 Setting up GoEth Private Blockchain Network..."

# Create blockchain directory
mkdir -p blockchain-data
cd blockchain-data

echo "📦 Initializing Clique PoA (GoEth)..."

# Create signer (validator) account
echo "👤 Creating validator account..."
echo "admin123" > password.txt
VALIDATOR=$(geth --datadir ./data account new --password password.txt | awk -F'[{}]' '/Public address of the key/{print $2}')
echo "Validator address: $VALIDATOR"

# Build Clique PoA genesis with validator in extraData
EXTRA_DATA="0x$(printf '%064s' | tr ' ' 0)${VALIDATOR#0x}$(printf '%130s' | tr ' ' 0)"
cat > ../genesis.json << EOF
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
    "londonBlock": 0,
    "clique": { "period": 5, "epoch": 30000 }
  },
  "alloc": {
    "$VALIDATOR": { "balance": "0x3635C9ADC5DEA00000" }
  },
  "coinbase": "0x0000000000000000000000000000000000000000",
  "difficulty": "0x1",
  "extraData": "$EXTRA_DATA",
  "gasLimit": "0x8000000",
  "nonce": "0x0000000000000042",
  "mixhash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "timestamp": "0x00"
}
EOF

# Initialize with Clique genesis
geth --datadir ./data init ../genesis.json

# Start the PoA node (validator)
echo "🔄 Starting Clique validator node..."
geth --datadir ./data --networkid 1337 --syncmode full --http --http.addr "0.0.0.0" --http.port 8545 --http.api "eth,net,web3,personal,admin" --http.corsdomain "*" --ws --ws.addr "0.0.0.0" --ws.port 8546 --ws.api "eth,net,web3,personal,admin" --ws.origins "*" --unlock $VALIDATOR --password password.txt --mine --miner.threads 1 --miner.etherbase $VALIDATOR &

# Wait for node to start
sleep 10

# Deploy smart contract
echo "📄 Deploying CredentialManager contract..."
cd ..
node deploy-contract.js

echo "✅ GoEth private blockchain network is running!"
echo "🌐 RPC Endpoint: http://localhost:8545"
echo "🔗 WebSocket: ws://localhost:8546"
echo "👤 Admin Address: $ADMIN_ADDRESS"
echo "📄 Contract deployed at: $(cat contract-address.txt)"
