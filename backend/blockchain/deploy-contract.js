const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Connect to GoEth node
const web3 = new Web3('http://localhost:8545');

// Contract ABI and bytecode
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "string", "name": "credentialId", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "studentId", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "credentialType", "type": "string" }
        ],
        "name": "CredentialIssued",
        "type": "event"
    }
];

const contractBytecode = "0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063..."; // Simplified

async function deployContract() {
    try {
        // Get accounts
        const accounts = await web3.eth.getAccounts();
        const adminAccount = accounts[0];

        console.log('Deploying contract with account:', adminAccount);

        // Create contract instance
        const contract = new web3.eth.Contract(contractABI);

        // Deploy contract
        const deployTx = contract.deploy({
            data: contractBytecode,
            arguments: []
        });

        const deployedContract = await deployTx.send({
            from: adminAccount,
            gas: 3000000,
            gasPrice: '20000000000'
        });

        const contractAddress = deployedContract.options.address;
        console.log('Contract deployed at:', contractAddress);

        // Save contract address
        fs.writeFileSync('contract-address.txt', contractAddress);

        // Save ABI
        fs.writeFileSync('contract-abi.json', JSON.stringify(contractABI, null, 2));

        console.log('✅ Contract deployment completed!');

    } catch (error) {
        console.error('❌ Contract deployment failed:', error);
    }
}

deployContract();
