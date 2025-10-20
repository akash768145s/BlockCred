# BlockCred Real Blockchain Implementation

Complete GoEth private blockchain integration for credential management.

## 🚀 Quick Start

### Prerequisites
- **Go** (v1.21+)
- **Geth** (GoEth client)
- **Node.js** (for contract deployment)
- **Docker** (for monitoring stack)

### Setup Blockchain
```bash
# Make setup script executable
chmod +x setup-blockchain.sh

# Run setup
./setup-blockchain.sh
```

## 🏗️ Architecture

### Smart Contract (`CredentialManager.sol`)
- **Student Registration**: Store student data on blockchain
- **Student Approval**: Assign blockchain nodes to approved students
- **Credential Issuance**: Issue and store certificates on blockchain
- **Credential Verification**: Verify certificate authenticity
- **Access Control**: Admin-only functions with proper permissions

### Go Client (`blockchain/client.go`)
- **Ethereum Integration**: Full GoEth client implementation
- **Smart Contract Interaction**: Deploy, call, and query contracts
- **Node Management**: Generate and assign unique node addresses
- **Credential Management**: Issue, store, and verify credentials
- **Error Handling**: Comprehensive error handling and logging

### GoEth Private Network (Clique PoA)
- **Chain ID**: 1337 (private testnet)
- **Consensus**: Proof of Authority using Clique
- **Block period**: 5s (configurable)
- **Epoch length**: 30,000 blocks (configurable)
- **RPC Endpoint**: http://localhost:8545
- **WebSocket**: ws://localhost:8546
- **Mining**: Signers (validators) seal blocks

## 📋 Features

### Real Blockchain Operations
1. **Student Registration**
   - Student data stored on blockchain
   - Immutable academic records
   - Unique student ID generation

2. **Node Assignment**
   - Each approved student gets a blockchain node
   - Deterministic node address generation
   - Node ownership tracking

3. **Credential Storage**
   - Certificates stored as smart contract events
   - Tamper-proof credential records
   - Institution verification support

4. **Credential Verification**
   - Public verification of certificates
   - Blockchain-based authenticity
   - No central authority dependency

### Smart Contract Functions

#### Admin Functions
```solidity
function registerStudent(string memory studentId, string memory name, ...)
function approveStudent(string memory studentId, address nodeAddress)
function issueCredential(string memory credentialId, ...)
```

#### Public Functions
```solidity
function getStudent(string memory studentId) returns (...)
function getCredential(string memory credentialId) returns (...)
function verifyCredential(string memory credentialId) returns (bool)
function getStudentCredentials(address nodeAddress) returns (string[])
```

## 🔧 Configuration

### Environment Variables
```bash
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here
BLOCKCHAIN_CONTRACT_ADDRESS=your-contract-address-here
```

### Network Configuration
- **Network ID**: 1337
- **Chain ID**: 1337
- **Gas Limit**: 0x8000000
- **Difficulty**: 0x400

## 📊 Monitoring Integration

### Blockchain Metrics
- **Node Assignment Tracking**: Real blockchain node assignments
- **Credential Issuance**: Blockchain-based certificate storage
- **Transaction Monitoring**: Gas usage and transaction success rates
- **Network Health**: GoEth node status and connectivity

### Prometheus Metrics
```go
blockcred_blockchain_nodes_active
blockcred_certificates_issued_total
blockcred_students_registered_total
blockcred_transactions_total
```

## 🛠️ Development

### Local Development (Clique PoA)
```bash
# Start Clique validator node
geth --datadir ./blockchain-data/data --networkid 1337 --syncmode full \
  --http --http.addr 0.0.0.0 --http.port 8545 --http.api eth,net,web3,personal,admin \
  --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.api eth,net,web3,personal,admin \
  --unlock <VALIDATOR_ADDRESS> --password blockchain-data/password.txt --mine --miner.etherbase <VALIDATOR_ADDRESS>

# Deploy contract
node deploy-contract.js

# Start backend
go run main.go
```

### Testing Blockchain
```bash
# Test blockchain connection
curl http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test contract interaction
curl http://localhost:8080/api/users
```

## 🔐 Security Features

### Access Control
- **Admin-only functions**: Student approval, credential issuance
- **Public verification**: Certificate verification without admin access
- **Node ownership**: Each student owns their blockchain node

### Data Integrity
- **Immutable records**: Once stored, data cannot be modified
- **Cryptographic verification**: All transactions are cryptographically signed
- **Decentralized storage**: No single point of failure

### Privacy
- **Private network**: GoEth private blockchain
- **Controlled access**: Only authorized institutions can issue credentials
- **Student privacy**: Students control their own data

## 📈 Performance

### Scalability
- **Private network**: Faster than public Ethereum
- **Optimized gas**: Efficient smart contract design
- **Batch operations**: Multiple credentials in single transaction

### Monitoring
- **Real-time metrics**: Prometheus integration
- **Transaction tracking**: Full audit trail
- **Performance monitoring**: Response times and success rates

## 🚨 Troubleshooting

### Common Issues

1. **GoEth not starting**
   ```bash
   # Check if port 8545 is available
   netstat -an | grep 8545
   
   # Kill existing processes
   pkill geth
   ```

2. **Contract deployment fails**
   ```bash
   # Check GoEth is running
   curl http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   
   # Check admin account has ETH
   geth attach http://localhost:8545
   > eth.getBalance(eth.accounts[0])
   ```

3. **Backend can't connect to blockchain**
   ```bash
   # Check environment variables
   cat .env
   
   # Test RPC connection
   curl http://localhost:8545
   ```

### Debug Commands
```bash
# Check GoEth logs
tail -f blockchain-data/geth.log

# Check backend logs
go run main.go -v

# Test blockchain client
go test ./blockchain/
```

## 🔄 Maintenance

### Regular Tasks
- **Monitor blockchain health**: Check node status
- **Backup blockchain data**: Regular backups of blockchain-data/
- **Update smart contracts**: Deploy new versions if needed
- **Monitor gas usage**: Optimize transaction costs

### Scaling
- **Multiple nodes**: Add more GoEth nodes for redundancy
- **Load balancing**: Distribute requests across nodes
- **Database integration**: Store frequently accessed data in database
- **Caching**: Cache blockchain data for faster access

## 📚 API Reference

### Blockchain Endpoints
- `POST /api/register` - Register student (stores on blockchain)
- `POST /api/users/{id}/approve` - Approve student (assigns blockchain node)
- `POST /api/certificates/issue` - Issue certificate (stores on blockchain)
- `GET /api/student/{id}` - Get student data (from blockchain)
- `GET /api/verify/{credentialId}` - Verify credential (blockchain verification)

### Smart Contract Events
```solidity
event StudentRegistered(string indexed studentId, string name, string email);
event StudentApproved(string indexed studentId, address nodeAddress);
event CredentialIssued(string indexed credentialId, string studentId, string credentialType);
event CredentialVerified(string indexed credentialId, bool isVerified);
```

---

**🎯 Your BlockCred system now has REAL blockchain integration with GoEth!**
