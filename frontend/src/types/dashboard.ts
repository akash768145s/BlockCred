export interface Student {
    id: number | string;
    name: string;
    student_id: string;
    email: string;
    department: string;
    semester: string;
    is_active: boolean;
}

export interface COECredential {
    id: number | string;
    type: string;
    title: string;
    student_id: string;
    student_name: string;
    semester: string;
    subject: string;
    marks: string;
    grade: string;
    issued_date: string;
    status: string;
    cert_type?: string;
    metadata?: {
        semester?: string;
        course?: string;
        cgpa?: string;
        grade?: string;
        [key: string]: any;
    };
    issued_at?: string;
}

export interface FacultyCredential {
    id: number | string;
    type: string;
    title: string;
    student_id: string;
    student_name: string;
    purpose: string;
    issued_date: string;
    status: string;
    description: string;
    cert_type?: string;
    metadata?: {
        description?: string;
        [key: string]: any;
    };
    issued_at?: string;
}

export interface ClubCredential {
    id: string;
    cert_id: string;
    cert_type: string;
    student_id: string;
    issuer_id: string;
    file_hash: string;
    ipfs_cid: string;
    ipfs_url: string;
    tx_hash: string;
    block_number: number;
    status: string;
    issued_at: string;
    metadata: {
        student_name: string;
        event_name: string;
        position: string;
        description: string;
        [key: string]: any;
    };
}

export interface Subject {
    id: string;
    subject_code: string;
    subject_name: string;
    marks: string;
    grade: string;
    credits: string;
}

export interface IssueCredentialFormData {
    student_id: string;
    type: string;
    semester: string;
    cgpa: string;
    // Dynamic extra fields coming from CredentialTypeConfig.fields
    extra?: Record<string, any>;
}

export interface IssueCertificateFormData {
    student_id: string;
    type: string;
    title: string;
    purpose: string;
    description: string;
    valid_until: string;
    // Dynamic extra fields coming from CredentialTypeConfig.fields
    extra?: Record<string, any>;
}

export interface IssueClubCertificateFormData {
    student_id: string;
    type: string;
    title: string;
    event_name: string;
    position: string;
    description: string;
    event_date: string;
    // Dynamic extra fields coming from CredentialTypeConfig.fields
    extra?: Record<string, any>;
}

