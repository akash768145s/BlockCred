# Setup Scripts

Scripts for installing and managing the Besu blockchain network.

## Scripts

- `install-besu.ps1` - Install Hyperledger Besu on Windows
- `start-besu.bat` - Start Besu PoA network (Windows)
- `start-besu.sh` - Start Besu PoA network (Linux/macOS)
- `check-status.bat` - Check if Besu is running

## Usage

### Install Besu
```powershell
.\blockchain\scripts\setup\install-besu.ps1
```

### Start Network
```powershell
# Windows
.\blockchain\scripts\setup\start-besu.bat

# Linux/macOS
.\blockchain\scripts\setup\start-besu.sh
```

### Check Status
```powershell
.\blockchain\scripts\setup\check-status.bat
```

## Network Details

- **RPC**: http://localhost:8545
- **WebSocket**: ws://localhost:8546
- **Network ID**: 1337
- **Consensus**: Clique (PoA)
- **Block Period**: 5 seconds

