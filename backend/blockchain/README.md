# BlockCred Blockchain Network

Complete setup and management for the Hyperledger Besu Proof of Authority (PoA) blockchain network.

## 📁 Directory Structure

```
blockchain/
├── config/              # Network configuration
│   └── genesis.json     # Genesis block configuration
├── scripts/             # Management scripts
│   ├── setup/          # Installation and startup scripts
│   ├── data/           # Data storage and viewing scripts
│   └── deploy/         # Contract deployment scripts
├── data/               # Blockchain data (auto-generated)
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Install Besu

**Windows:**
```powershell
.\scripts\setup\install-besu.ps1
```

**Linux/macOS:**
```bash
# Download from https://github.com/hyperledger/besu/releases
# Or use: brew install hyperledger/besu/besu
```

### 2. Start Blockchain Network

**Windows:**
```powershell
.\scripts\setup\start-besu.bat
```

**Linux/macOS:**
```bash
.\scripts\setup\start-besu.sh
```

### 3. Verify Network Status

**Windows:**
```powershell
.\scripts\setup\check-status.bat
```

**Linux/macOS:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 📊 Network Configuration

- **Network ID**: 1337
- **Chain ID**: 1337
- **Consensus**: Clique (Proof of Authority)
- **Block Period**: 5 seconds
- **RPC HTTP**: http://localhost:8545
- **RPC WebSocket**: ws://localhost:8546
- **Validator**: `0x53b8be11aada878bbf830e426d5d3071c34facef`
- **Initial Balance**: 1,000,000 ETH

## 💾 Storing Data on Blockchain

### Store Certificate Data

**PowerShell:**
```powershell
.\scripts\data\store-certificate.ps1
```

**Go:**
```bash
go run scripts/data/store-certificate.go
```

### View Stored Certificates

**PowerShell:**
```powershell
# View all certificates
.\scripts\data\get-certificates.ps1

# View specific certificate
.\scripts\data\view-certificate.ps1 -CertId "0x..."

# Verify certificate on-chain
.\scripts\data\verify-on-chain.ps1 -CertId "0x..."
```

### Check Blockchain Data

```powershell
.\scripts\data\verify-besu-storage.ps1
```

## 🔧 Scripts Overview

### Setup Scripts (`scripts/setup/`)

- `install-besu.ps1` - Install Hyperledger Besu
- `start-besu.bat` / `start-besu.sh` - Start Besu PoA network
- `check-status.bat` - Check if Besu is running

### Data Scripts (`scripts/data/`)

- `store-certificate.ps1` - Store certificate on blockchain
- `get-certificates.ps1` - Get all certificates
- `view-certificate.ps1` - View specific certificate
- `verify-on-chain.ps1` - Verify certificate on-chain
- `verify-besu-storage.ps1` - Check data storage
- `view-blockchain-data.go` - Go script to view blockchain data

### Deploy Scripts (`scripts/deploy/`)

- `deploy-contract.js` - Deploy smart contract to Besu

## 📋 On-Chain Data Structure

When you store a certificate, these fields are stored on the blockchain:

| Field | Purpose | Example |
|-------|---------|---------|
| **Certificate Hash** | Verifiability & tamper detection | `0xabc123...` |
| **Metadata Hash** | Prevent edits | `0xdef456...` |
| **Issuer Address** | Trust of authority | `0x53b8be11...` |
| **Timestamp** | Immutable proof of time | `1734567890` |
| **Student Wallet** | Persistent academic identity | `0x742d35...` |
| **Revocation Flag** | Allows invalidation | `false` |

## 🔍 Verifying Data Storage

### Via API

```powershell
# Login first
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"admin@ssn.edu.in","password":"admin123"}'
$token = $login.data.token

# Get certificates
$headers = @{"Authorization" = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:8080/api/certificates" `
  -Method GET -Headers $headers

# Verify certificate
Invoke-RestMethod -Uri "http://localhost:8080/api/blockchain/verify-certificate?cert_id=<cert_id>" `
  -Method GET -Headers $headers
```

### Direct Blockchain Query

```powershell
# Get block by number
$body = @{
    jsonrpc = "2.0"
    method = "eth_getBlockByNumber"
    params = @("0x37766", $true)  # Block 227054
    id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8545" `
  -Method POST -ContentType "application/json" -Body $body
```

## 🛠️ Troubleshooting

### Besu Not Starting

1. Check Java version: `java -version` (needs Java 17+)
2. Check if port 8545 is in use
3. Verify Besu is in PATH: `besu --version`

### Data Not Appearing

1. Check Besu is running: `.\scripts\setup\check-status.bat`
2. Verify contract is deployed (if using smart contracts)
3. Check transaction receipts on Besu

### Reset Blockchain

```powershell
# Stop Besu
# Delete data directory
Remove-Item -Recurse -Force blockchain\data
# Restart Besu (will reinitialize from genesis)
```

## 📚 Additional Resources

- [Besu Documentation](https://besu.hyperledger.org/)
- [Besu Releases](https://github.com/hyperledger/besu/releases)
- [Ethereum JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/)

## 🎯 Next Steps

1. ✅ Start Besu network
2. ✅ Store certificate data
3. ✅ Verify data on-chain
4. 🔄 Deploy smart contract (optional)
5. 🔄 Configure contract address in `.env`

---

**Your certificate data is stored immutably on the Besu PoA blockchain!** 🚀

