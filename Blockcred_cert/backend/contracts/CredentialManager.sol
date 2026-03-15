// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialManager {
    struct Credential {
        string credentialId;
        string credentialType;
        string title;
        string institution;
        string studentId;
        uint256 issuedDate;
        string description;
        bool isVerified;
        address issuer;
    }

    struct Student {
        string studentId;
        string name;
        string email;
        string school;
        uint256 tenthMarks;
        uint256 passingYear;
        bool isApproved;
        address nodeAddress;
    }

    // State variables
    address public admin;
    mapping(string => Student) public students;
    mapping(string => Credential) public credentials;
    mapping(address => string[]) public studentCredentials;
    mapping(string => bool) public credentialExists;
    
    string[] public allStudentIds;
    string[] public allCredentialIds;

    // Events
    event StudentRegistered(string indexed studentId, string name, string email);
    event StudentApproved(string indexed studentId, address nodeAddress);
    event CredentialIssued(string indexed credentialId, string studentId, string credentialType);
    event CredentialVerified(string indexed credentialId, bool isVerified);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier studentExists(string memory studentId) {
        require(bytes(students[studentId].studentId).length > 0, "Student does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Admin functions
    function registerStudent(
        string memory _studentId,
        string memory _name,
        string memory _email,
        string memory _school,
        uint256 _tenthMarks,
        uint256 _passingYear
    ) external onlyAdmin {
        require(bytes(students[_studentId].studentId).length == 0, "Student already exists");
        
        students[_studentId] = Student({
            studentId: _studentId,
            name: _name,
            email: _email,
            school: _school,
            tenthMarks: _tenthMarks,
            passingYear: _passingYear,
            isApproved: false,
            nodeAddress: address(0)
        });
        
        allStudentIds.push(_studentId);
        emit StudentRegistered(_studentId, _name, _email);
    }

    function approveStudent(string memory _studentId, address _nodeAddress) 
        external 
        onlyAdmin 
        studentExists(_studentId) 
    {
        students[_studentId].isApproved = true;
        students[_studentId].nodeAddress = _nodeAddress;
        emit StudentApproved(_studentId, _nodeAddress);
    }

    function issueCredential(
        string memory _credentialId,
        string memory _studentId,
        string memory _credentialType,
        string memory _title,
        string memory _institution,
        string memory _description
    ) external onlyAdmin studentExists(_studentId) {
        require(!credentialExists[_credentialId], "Credential ID already exists");
        require(students[_studentId].isApproved, "Student not approved");
        
        credentials[_credentialId] = Credential({
            credentialId: _credentialId,
            credentialType: _credentialType,
            title: _title,
            institution: _institution,
            studentId: _studentId,
            issuedDate: block.timestamp,
            description: _description,
            isVerified: true,
            issuer: msg.sender
        });
        
        credentialExists[_credentialId] = true;
        studentCredentials[students[_studentId].nodeAddress].push(_credentialId);
        allCredentialIds.push(_credentialId);
        
        emit CredentialIssued(_credentialId, _studentId, _credentialType);
    }

    // Public view functions
    function getStudent(string memory _studentId) 
        external 
        view 
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            bool,
            address
        ) 
    {
        Student memory student = students[_studentId];
        return (
            student.studentId,
            student.name,
            student.email,
            student.school,
            student.tenthMarks,
            student.passingYear,
            student.isApproved,
            student.nodeAddress
        );
    }

    function getCredential(string memory _credentialId) 
        external 
        view 
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            string memory,
            bool,
            address
        ) 
    {
        Credential memory credential = credentials[_credentialId];
        return (
            credential.credentialId,
            credential.credentialType,
            credential.title,
            credential.institution,
            credential.studentId,
            credential.issuedDate,
            credential.description,
            credential.isVerified,
            credential.issuer
        );
    }

    function getStudentCredentials(address _nodeAddress) 
        external 
        view 
        returns (string[] memory) 
    {
        return studentCredentials[_nodeAddress];
    }

    function getAllStudents() external view returns (string[] memory) {
        return allStudentIds;
    }

    function getAllCredentials() external view returns (string[] memory) {
        return allCredentialIds;
    }

    function verifyCredential(string memory _credentialId) 
        external 
        view 
        returns (bool) 
    {
        return credentialExists[_credentialId] && credentials[_credentialId].isVerified;
    }

    function getTotalStudents() external view returns (uint256) {
        return allStudentIds.length;
    }

    function getTotalCredentials() external view returns (uint256) {
        return allCredentialIds.length;
    }

    function getApprovedStudents() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allStudentIds.length; i++) {
            if (students[allStudentIds[i]].isApproved) {
                count++;
            }
        }
        return count;
    }
}
