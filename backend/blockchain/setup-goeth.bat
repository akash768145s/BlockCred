@echo off
echo 🚀 Setting up GoEth Private Blockchain Network...

REM Create blockchain directory
if not exist blockchain-data mkdir blockchain-data
cd blockchain-data

REM Initialize GoEth
echo 📦 Initializing GoEth...
REM Initialize Clique PoA
echo 📦 Initializing Clique PoA...
geth --datadir ./data init ../genesis.json

REM Create validator account
echo 👤 Creating validator account...
echo admin123 > password.txt
for /f "tokens=6 delims={}" %%a in ('geth --datadir ./data account new --password password.txt ^| findstr /c:"Public address of the key"') do set VALIDATOR=0x%%a
echo Validator: %VALIDATOR%

REM Build genesis with Clique extraData (manual step for Windows)
echo ⚠️  Please update extraData and alloc in ..\genesis.json to include validator %VALIDATOR%
pause

REM Initialize with updated genesis
geth --datadir ./data init ../genesis.json

REM Start the PoA validator node
echo 🔄 Starting Clique validator node...
start "GoEth PoA Node" geth --datadir ./data --networkid 1337 --syncmode full --http --http.addr "0.0.0.0" --http.port 8545 --http.api "eth,net,web3,personal,admin" --http.corsdomain "*" --ws --ws.addr "0.0.0.0" --ws.port 8546 --ws.api "eth,net,web3,personal,admin" --ws.origins "*" --unlock %VALIDATOR% --password password.txt --mine --miner.threads 1 --miner.etherbase %VALIDATOR%

echo ✅ GoEth private blockchain network is running!
echo 🌐 RPC Endpoint: http://localhost:8545
echo 🔗 WebSocket: ws://localhost:8546
echo 👤 Admin Address: %ADMIN_ADDRESS%
