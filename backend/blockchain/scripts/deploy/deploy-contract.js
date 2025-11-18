// Simple contract deployment script for Besu
// Run with: node scripts/deploy-contract.js

const Web3 = require('web3');

const RPC_URL = 'http://localhost:8545';
const PRIVATE_KEY = '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63'; // From genesis validator
const CONTRACT_SOL = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateManager {
    struct Certificate {
        string certId;
        string studentId;
        string certType;
        string ipfsCID;
        string fileHash;
        string metadataHash;
        uint256 issuedAt;
        address issuer;
        address studentWallet;
        bool isRevoked;
        uint256 revokedAt;
    }
    
    mapping(string => address) public studentWallets;
    mapping(address => string) public walletStudents;
    
    struct Issuer {
        address issuerAddress;
        string name;
        string role;
        string institution;
        bool isActive;
        uint256 registeredAt;
    }
    
    address public admin;
    mapping(string => Certificate) public certificates;
    mapping(string => bool) public certificateExists;
    mapping(address => Issuer) public issuers;
    mapping(address => bool) public isAuthorizedIssuer;
    mapping(string => string[]) public studentCertificates;
    
    string[] public allCertificateIds;
    address[] public allIssuers;
    
    event StudentWalletRegistered(string indexed studentId, address walletAddress);
    event IssuerRegistered(address indexed issuerAddress, string name, string role, string institution);
    event IssuerDeactivated(address indexed issuerAddress);
    event CertificateIssued(string indexed certId, string studentId, string certType, string ipfsCID, address issuer);
    event CertificateRevoked(string indexed certId, address revoker, string reason);
    event CertificateVerified(string indexed certId, bool isValid);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyAuthorizedIssuer() {
        require(isAuthorizedIssuer[msg.sender], "Only authorized issuers can perform this action");
        require(issuers[msg.sender].isActive, "Issuer account is deactivated");
        _;
    }
    
    modifier certificateNotExists(string memory _certId) {
        require(!certificateExists[_certId], "Certificate ID already exists");
        _;
    }
    
    modifier requireCertificateExists(string memory _certId) {
        require(certificateExists[_certId], "Certificate does not exist");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function registerIssuer(
        address _issuerAddress,
        string memory _name,
        string memory _role,
        string memory _institution
    ) external onlyAdmin {
        require(!isAuthorizedIssuer[_issuerAddress], "Issuer already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_role).length > 0, "Role cannot be empty");
        require(bytes(_institution).length > 0, "Institution cannot be empty");
        
        issuers[_issuerAddress] = Issuer({
            issuerAddress: _issuerAddress,
            name: _name,
            role: _role,
            institution: _institution,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        isAuthorizedIssuer[_issuerAddress] = true;
        allIssuers.push(_issuerAddress);
        
        emit IssuerRegistered(_issuerAddress, _name, _role, _institution);
    }
    
    function registerStudentWallet(string memory _studentId, address _walletAddress) external onlyAuthorizedIssuer {
        require(_walletAddress != address(0), "Invalid wallet address");
        require(studentWallets[_studentId] == address(0), "Student wallet already registered");
        
        studentWallets[_studentId] = _walletAddress;
        walletStudents[_walletAddress] = _studentId;
        
        emit StudentWalletRegistered(_studentId, _walletAddress);
    }
    
    function issueCertificate(
        string memory _certId,
        string memory _studentId,
        string memory _certType,
        string memory _ipfsCID,
        string memory _fileHash,
        string memory _metadataHash,
        address _studentWallet
    ) external onlyAuthorizedIssuer certificateNotExists(_certId) {
        require(bytes(_studentId).length > 0, "Student ID cannot be empty");
        require(bytes(_certType).length > 0, "Certificate type cannot be empty");
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");
        
        if (studentWallets[_studentId] == address(0)) {
            studentWallets[_studentId] = _studentWallet;
            walletStudents[_studentWallet] = _studentId;
            emit StudentWalletRegistered(_studentId, _studentWallet);
        }
        
        certificates[_certId] = Certificate({
            certId: _certId,
            studentId: _studentId,
            certType: _certType,
            ipfsCID: _ipfsCID,
            fileHash: _fileHash,
            metadataHash: _metadataHash,
            issuedAt: block.timestamp,
            issuer: msg.sender,
            studentWallet: _studentWallet,
            isRevoked: false,
            revokedAt: 0
        });
        
        certificateExists[_certId] = true;
        studentCertificates[_studentId].push(_certId);
        allCertificateIds.push(_certId);
        
        emit CertificateIssued(_certId, _studentId, _certType, _ipfsCID, msg.sender);
    }
    
    function verifyCertificate(string memory _certId) external view returns (bool) {
        return certificateExists[_certId] && !certificates[_certId].isRevoked;
    }
    
    function getCertificate(string memory _certId) external view requireCertificateExists(_certId) returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        uint256,
        address,
        address,
        bool,
        uint256
    ) {
        Certificate memory cert = certificates[_certId];
        return (
            cert.certId,
            cert.studentId,
            cert.certType,
            cert.ipfsCID,
            cert.fileHash,
            cert.metadataHash,
            cert.issuedAt,
            cert.issuer,
            cert.studentWallet,
            cert.isRevoked,
            cert.revokedAt
        );
    }
}
`;

async function deploy() {
    const web3 = new Web3(RPC_URL);
    
    // Get account from private key
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    console.log('📝 Deploying CertificateManager contract...');
    console.log('   Account:', account.address);
    
    // Note: In production, you'd compile the contract first and get the bytecode
    // For now, this is a template - you need to compile the contract first
    
    console.log('\n⚠️  To deploy:');
    console.log('1. Compile the contract using solc or Remix');
    console.log('2. Get the bytecode and ABI');
    console.log('3. Use web3.eth.Contract to deploy');
    console.log('\nOr use Remix IDE:');
    console.log('1. Go to https://remix.ethereum.org');
    console.log('2. Connect to http://localhost:8545');
    console.log('3. Deploy CertificateManager.sol');
}

deploy().catch(console.error);

