// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateManager {
    struct Certificate {
        string certId;           // keccak256(fileHash + studentId + issuedAt)
        string studentId;
        string certType;         // marksheet, bonafide, noc, participation_cert, degree
        string ipfsCID;          // IPFS Content Identifier
        string fileHash;         // SHA256 hash of the certificate file (Credential Hash)
        string metadataHash;     // SHA256 hash of metadata JSON
        uint256 issuedAt;        // Timestamp when issued
        address issuer;          // Address of the issuer (COE/Dept/Club)
        address studentWallet;   // Student wallet address
        bool isRevoked;          // Revocation status
        uint256 revokedAt;       // Timestamp when revoked
    }
    
    // Student ID to Wallet Address mapping
    mapping(string => address) public studentWallets;
    mapping(address => string) public walletStudents;

    struct Issuer {
        address issuerAddress;
        string name;
        string role;             // coe, department_faculty, club_coordinator
        string institution;
        bool isActive;
        uint256 registeredAt;
    }

    // State variables
    address public admin;
    mapping(string => Certificate) public certificates;
    mapping(string => bool) public certificateExists;
    mapping(address => Issuer) public issuers;
    mapping(address => bool) public isAuthorizedIssuer;
    mapping(string => string[]) public studentCertificates;
    
    string[] public allCertificateIds;
    address[] public allIssuers;
    
    // Events for student-wallet mapping
    event StudentWalletRegistered(string indexed studentId, address walletAddress);

    // Events
    event IssuerRegistered(address indexed issuerAddress, string name, string role, string institution);
    event IssuerDeactivated(address indexed issuerAddress);
    event CertificateIssued(string indexed certId, string studentId, string certType, string ipfsCID, address issuer);
    event CertificateRevoked(string indexed certId, address revoker, string reason);
    event CertificateVerified(string indexed certId, bool isValid);

    // Modifiers
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

    // Admin functions
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

    function deactivateIssuer(address _issuerAddress) external onlyAdmin {
        require(isAuthorizedIssuer[_issuerAddress], "Issuer not found");
        issuers[_issuerAddress].isActive = false;
        isAuthorizedIssuer[_issuerAddress] = false;
        emit IssuerDeactivated(_issuerAddress);
    }

    // Register student wallet
    function registerStudentWallet(string memory _studentId, address _walletAddress) external onlyAuthorizedIssuer {
        require(_walletAddress != address(0), "Invalid wallet address");
        require(studentWallets[_studentId] == address(0), "Student wallet already registered");
        
        studentWallets[_studentId] = _walletAddress;
        walletStudents[_walletAddress] = _studentId;
        
        emit StudentWalletRegistered(_studentId, _walletAddress);
    }
    
    // Get student wallet
    function getStudentWallet(string memory _studentId) external view returns (address) {
        return studentWallets[_studentId];
    }
    
    // Get student ID from wallet
    function getWalletStudent(address _walletAddress) external view returns (string memory) {
        return walletStudents[_walletAddress];
    }

    // Issuer functions
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

        // Validate certificate type based on issuer role
        string memory issuerRole = issuers[msg.sender].role;
        require(
            (keccak256(bytes(issuerRole)) == keccak256(bytes("coe")) && 
             (keccak256(bytes(_certType)) == keccak256(bytes("marksheet")) || 
              keccak256(bytes(_certType)) == keccak256(bytes("degree")))) ||
            (keccak256(bytes(issuerRole)) == keccak256(bytes("department_faculty")) && 
             (keccak256(bytes(_certType)) == keccak256(bytes("bonafide")) || 
              keccak256(bytes(_certType)) == keccak256(bytes("noc")))) ||
            (keccak256(bytes(issuerRole)) == keccak256(bytes("club_coordinator")) && 
             keccak256(bytes(_certType)) == keccak256(bytes("participation_cert"))),
            "Invalid certificate type for this issuer role"
        );

        require(studentWallets[_studentId] == _studentWallet || studentWallets[_studentId] == address(0), 
            "Student wallet mismatch");
        
        // Auto-register wallet if not exists
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

    function revokeCertificate(string memory _certId, string memory _reason) 
        external 
        onlyAuthorizedIssuer 
        requireCertificateExists(_certId)
    {
        require(!certificates[_certId].isRevoked, "Certificate already revoked");
        require(
            certificates[_certId].issuer == msg.sender || msg.sender == admin,
            "Only issuer or admin can revoke certificate"
        );

        certificates[_certId].isRevoked = true;
        certificates[_certId].revokedAt = block.timestamp;

        emit CertificateRevoked(_certId, msg.sender, _reason);
    }

    // Public view functions
    function getCertificate(string memory _certId) 
        external 
        requireCertificateExists(_certId)
        view 
        returns (
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
        ) 
    {
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

    function getStudentCertificates(string memory _studentId) 
        external 
        view 
        returns (string[] memory) 
    {
        return studentCertificates[_studentId];
    }

    function verifyCertificate(string memory _certId) 
        external 
        view 
        returns (bool) 
    {
        return certificateExists[_certId] && !certificates[_certId].isRevoked;
    }

    function getIssuerInfo(address _issuerAddress) 
        external 
        view 
        returns (
            string memory,
            string memory,
            string memory,
            bool,
            uint256
        ) 
    {
        require(isAuthorizedIssuer[_issuerAddress], "Issuer not found");
        Issuer memory issuer = issuers[_issuerAddress];
        return (
            issuer.name,
            issuer.role,
            issuer.institution,
            issuer.isActive,
            issuer.registeredAt
        );
    }

    function getAllCertificates() external view returns (string[] memory) {
        return allCertificateIds;
    }

    function getAllIssuers() external view returns (address[] memory) {
        return allIssuers;
    }

    function getTotalCertificates() external view returns (uint256) {
        return allCertificateIds.length;
    }

    function getTotalIssuers() external view returns (uint256) {
        return allIssuers.length;
    }

    function getActiveIssuers() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allIssuers.length; i++) {
            if (issuers[allIssuers[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    function getCertificateCountByType(string memory _certType) external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allCertificateIds.length; i++) {
            if (keccak256(bytes(certificates[allCertificateIds[i]].certType)) == keccak256(bytes(_certType))) {
                count++;
            }
        }
        return count;
    }

    function getCertificateCountByIssuer(address _issuer) external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allCertificateIds.length; i++) {
            if (certificates[allCertificateIds[i]].issuer == _issuer) {
                count++;
            }
        }
        return count;
    }
}
