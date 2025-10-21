// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RoleManager
 * @dev Smart contract for managing roles and permissions in BlockCred system
 */
contract RoleManager {
    // Role definitions
    enum Role {
        SSN_MAIN_ADMIN,
        COE,
        DEPARTMENT_FACULTY,
        CLUB_COORDINATOR,
        EXTERNAL_VERIFIER,
        STUDENT
    }

    // Permission definitions
    enum Permission {
        ONBOARD_SUB_ADMINS,
        DEPLOY_CONTRACTS,
        AUTHORIZE_VALIDATORS,
        ISSUE_MARKSHEET,
        ISSUE_BONAFIDE,
        ISSUE_NOC,
        ISSUE_PARTICIPATION,
        VERIFY_CREDENTIALS,
        READ_ONLY_ACCESS,
        MANAGE_USERS,
        VIEW_ALL_CREDENTIALS,
        APPROVE_STUDENTS
    }

    // Role permissions mapping
    mapping(Role => mapping(Permission => bool)) public rolePermissions;
    
    // User roles mapping
    mapping(address => Role) public userRoles;
    
    // User addresses by role
    mapping(Role => address[]) public roleUsers;
    
    // Events
    event RoleAssigned(address indexed user, Role indexed role);
    event RoleRevoked(address indexed user, Role indexed role);
    event PermissionGranted(Role indexed role, Permission indexed permission);
    event PermissionRevoked(Role indexed role, Permission indexed permission);
    event UserOnboarded(address indexed user, Role indexed role, string name, string email);

    // Modifiers
    modifier onlyRole(Role role) {
        require(userRoles[msg.sender] == role, "Insufficient role");
        _;
    }

    modifier onlyAdmin() {
        require(userRoles[msg.sender] == Role.SSN_MAIN_ADMIN, "Only SSN Main Admin");
        _;
    }

    modifier hasPermission(Permission permission) {
        require(hasUserPermission(msg.sender, permission), "Insufficient permission");
        _;
    }

    constructor() {
        _initializeRolePermissions();
        // Deployer becomes SSN Main Admin
        userRoles[msg.sender] = Role.SSN_MAIN_ADMIN;
        roleUsers[Role.SSN_MAIN_ADMIN].push(msg.sender);
    }

    /**
     * @dev Initialize role permissions
     */
    function _initializeRolePermissions() internal {
        // SSN Main Admin - Full permissions
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.ONBOARD_SUB_ADMINS] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.DEPLOY_CONTRACTS] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.AUTHORIZE_VALIDATORS] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.ISSUE_MARKSHEET] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.ISSUE_BONAFIDE] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.ISSUE_NOC] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.ISSUE_PARTICIPATION] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.VERIFY_CREDENTIALS] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.READ_ONLY_ACCESS] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.MANAGE_USERS] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.VIEW_ALL_CREDENTIALS] = true;
        rolePermissions[Role.SSN_MAIN_ADMIN][Permission.APPROVE_STUDENTS] = true;

        // COE - Examination permissions
        rolePermissions[Role.COE][Permission.ISSUE_MARKSHEET] = true;
        rolePermissions[Role.COE][Permission.VERIFY_CREDENTIALS] = true;
        rolePermissions[Role.COE][Permission.READ_ONLY_ACCESS] = true;
        rolePermissions[Role.COE][Permission.VIEW_ALL_CREDENTIALS] = true;

        // Department Faculty - Department permissions
        rolePermissions[Role.DEPARTMENT_FACULTY][Permission.ISSUE_BONAFIDE] = true;
        rolePermissions[Role.DEPARTMENT_FACULTY][Permission.ISSUE_NOC] = true;
        rolePermissions[Role.DEPARTMENT_FACULTY][Permission.VERIFY_CREDENTIALS] = true;
        rolePermissions[Role.DEPARTMENT_FACULTY][Permission.READ_ONLY_ACCESS] = true;

        // Club Coordinator - Club permissions
        rolePermissions[Role.CLUB_COORDINATOR][Permission.ISSUE_PARTICIPATION] = true;
        rolePermissions[Role.CLUB_COORDINATOR][Permission.VERIFY_CREDENTIALS] = true;
        rolePermissions[Role.CLUB_COORDINATOR][Permission.READ_ONLY_ACCESS] = true;

        // External Verifier - Verification permissions
        rolePermissions[Role.EXTERNAL_VERIFIER][Permission.VERIFY_CREDENTIALS] = true;
        rolePermissions[Role.EXTERNAL_VERIFIER][Permission.READ_ONLY_ACCESS] = true;

        // Student - Basic permissions
        rolePermissions[Role.STUDENT][Permission.READ_ONLY_ACCESS] = true;
    }

    /**
     * @dev Onboard a new user with specific role
     * @param user Address of the user to onboard
     * @param role Role to assign to the user
     * @param name Name of the user
     * @param email Email of the user
     */
    function onboardUser(
        address user,
        Role role,
        string memory name,
        string memory email
    ) external onlyAdmin {
        require(userRoles[user] == Role.STUDENT || userRoles[user] == Role(0), "User already has a role");
        
        userRoles[user] = role;
        roleUsers[role].push(user);
        
        emit UserOnboarded(user, role, name, email);
        emit RoleAssigned(user, role);
    }

    /**
     * @dev Assign role to user
     * @param user Address of the user
     * @param role Role to assign
     */
    function assignRole(address user, Role role) external onlyAdmin {
        require(user != address(0), "Invalid user address");
        
        // Remove from previous role if any
        if (userRoles[user] != Role(0)) {
            _removeUserFromRole(user, userRoles[user]);
        }
        
        userRoles[user] = role;
        roleUsers[role].push(user);
        
        emit RoleAssigned(user, role);
    }

    /**
     * @dev Revoke role from user
     * @param user Address of the user
     */
    function revokeRole(address user) external onlyAdmin {
        require(userRoles[user] != Role(0), "User has no role");
        
        Role currentRole = userRoles[user];
        _removeUserFromRole(user, currentRole);
        userRoles[user] = Role.STUDENT; // Default to student role
        
        emit RoleRevoked(user, currentRole);
    }

    /**
     * @dev Grant permission to role
     * @param role Role to grant permission to
     * @param permission Permission to grant
     */
    function grantPermission(Role role, Permission permission) external onlyAdmin {
        rolePermissions[role][permission] = true;
        emit PermissionGranted(role, permission);
    }

    /**
     * @dev Revoke permission from role
     * @param role Role to revoke permission from
     * @param permission Permission to revoke
     */
    function revokePermission(Role role, Permission permission) external onlyAdmin {
        rolePermissions[role][permission] = false;
        emit PermissionRevoked(role, permission);
    }

    /**
     * @dev Check if user has specific permission
     * @param user Address of the user
     * @param permission Permission to check
     * @return True if user has permission
     */
    function hasUserPermission(address user, Permission permission) public view returns (bool) {
        Role userRole = userRoles[user];
        return rolePermissions[userRole][permission];
    }

    /**
     * @dev Get user role
     * @param user Address of the user
     * @return Role of the user
     */
    function getUserRole(address user) external view returns (Role) {
        return userRoles[user];
    }

    /**
     * @dev Get all users with specific role
     * @param role Role to query
     * @return Array of user addresses
     */
    function getUsersByRole(Role role) external view returns (address[] memory) {
        return roleUsers[role];
    }

    /**
     * @dev Get role permissions
     * @param role Role to query
     * @param permission Permission to check
     * @return True if role has permission
     */
    function getRolePermission(Role role, Permission permission) external view returns (bool) {
        return rolePermissions[role][permission];
    }

    /**
     * @dev Remove user from role (internal function)
     * @param user Address of the user
     * @param role Role to remove user from
     */
    function _removeUserFromRole(address user, Role role) internal {
        address[] storage users = roleUsers[role];
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == user) {
                users[i] = users[users.length - 1];
                users.pop();
                break;
            }
        }
    }

    /**
     * @dev Get total number of users with specific role
     * @param role Role to query
     * @return Number of users
     */
    function getRoleUserCount(Role role) external view returns (uint) {
        return roleUsers[role].length;
    }

    /**
     * @dev Check if address has admin role
     * @param user Address to check
     * @return True if user is admin
     */
    function isAdmin(address user) external view returns (bool) {
        return userRoles[user] == Role.SSN_MAIN_ADMIN;
    }

    /**
     * @dev Check if address can issue credentials
     * @param user Address to check
     * @return True if user can issue credentials
     */
    function canIssueCredentials(address user) external view returns (bool) {
        return hasUserPermission(user, Permission.ISSUE_MARKSHEET) ||
               hasUserPermission(user, Permission.ISSUE_BONAFIDE) ||
               hasUserPermission(user, Permission.ISSUE_NOC) ||
               hasUserPermission(user, Permission.ISSUE_PARTICIPATION);
    }

    /**
     * @dev Check if address can verify credentials
     * @param user Address to check
     * @return True if user can verify credentials
     */
    function canVerifyCredentials(address user) external view returns (bool) {
        return hasUserPermission(user, Permission.VERIFY_CREDENTIALS);
    }

    /**
     * @dev Check if address can manage users
     * @param user Address to check
     * @return True if user can manage users
     */
    function canManageUsers(address user) external view returns (bool) {
        return hasUserPermission(user, Permission.MANAGE_USERS);
    }
}
