import { UserRole } from '@/types/auth';

export const getRoleIcon = (role: UserRole) => {
    switch (role) {
        case 'ssn_main_admin':
            return 'Shield';
        case 'coe':
            return 'FileText';
        case 'department_faculty':
            return 'GraduationCap';
        case 'club_coordinator':
            return 'Award';
        case 'student':
            return 'Users';
        default:
            return 'Users';
    }
};

export const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
        case 'ssn_main_admin':
            return 'SSN Main Admin';
        case 'coe':
            return 'Controller of Examinations';
        case 'department_faculty':
            return 'Department Faculty';
        case 'club_coordinator':
            return 'Club Coordinator';
        case 'student':
            return 'Student';
        default:
            return role;
    }
};

export const getRoleColor = (role: UserRole): string => {
    switch (role) {
        case 'ssn_main_admin':
            return 'bg-red-100 text-red-800';
        case 'coe':
            return 'bg-blue-100 text-blue-800';
        case 'department_faculty':
            return 'bg-green-100 text-green-800';
        case 'club_coordinator':
            return 'bg-purple-100 text-purple-800';
        case 'student':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getCredentialIcon = (type: string) => {
    switch (type) {
        case 'marksheet':
            return 'FileText';
        case 'degree':
            return 'GraduationCap';
        case 'noc':
            return 'Shield';
        case 'bonafide':
            return 'FileText';
        case 'participation_cert':
            return 'Award';
        default:
            return 'FileText';
    }
};

export const getCredentialColor = (type: string): string => {
    switch (type) {
        case 'marksheet':
            return 'bg-blue-100 text-blue-800';
        case 'degree':
            return 'bg-green-100 text-green-800';
        case 'noc':
            return 'bg-yellow-100 text-yellow-800';
        case 'bonafide':
            return 'bg-purple-100 text-purple-800';
        case 'participation_cert':
            return 'bg-pink-100 text-pink-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getStatusIcon = (status: string) => {
    switch (status) {
        case 'verified':
            return 'CheckCircle';
        case 'issued':
            return 'Clock';
        default:
            return 'Clock';
    }
};

export const generateShareUrl = (studentId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/student-wallet?id=${studentId}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
};

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }

    return { isValid: true, message: 'Password is valid' };
};
