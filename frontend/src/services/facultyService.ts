import { Student, FacultyCredential, IssueCertificateFormData } from '@/types/dashboard';

const API_BASE_URL = 'http://localhost:8080/api';

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const facultyService = {
    async fetchStudents(): Promise<Student[]> {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch students: ${response.statusText}`);
        }

        const data = await response.json();
        const allUsers = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        return allUsers.filter((user: any) => user.role === 'student');
    },

    async fetchCredentials(): Promise<FacultyCredential[]> {
        const response = await fetch(`${API_BASE_URL}/certificates/issuer`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch credentials: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    },

    async issueCertificate(formData: IssueCertificateFormData): Promise<any> {
        const token = localStorage.getItem('token');

        // Create a sample PDF file for bonafide/NOC
        const samplePdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(${formData.type.toUpperCase()} Certificate) Tj
0 -20 Td
(Student: ${formData.student_id}) Tj
0 -20 Td
(Purpose: ${formData.purpose}) Tj
0 -20 Td
(Valid Until: ${formData.valid_until}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
353
%%EOF`;

        const base64Content = btoa(samplePdfContent);

        // Get student info
        const students = await this.fetchStudents();
        const student = students.find(s => s.student_id === formData.student_id);

        const certificateData = {
            student_id: formData.student_id,
            cert_type: formData.type || 'bonafide',
            file_data: base64Content,
            file_name: `${formData.type}_${formData.student_id}_${Date.now()}.pdf`,
            metadata: {
                student_name: student?.name || 'Unknown Student',
                student_email: student?.email || '',
                issuer_name: 'Department Faculty',
                issuer_role: 'department_faculty',
                institution: 'SSN College of Engineering',
                course: student?.department || 'Computer Science',
                academic_year: '2024-25',
                valid_from: new Date().toISOString(),
                valid_until: formData.valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                description: formData.description || `${formData.type || 'Faculty'} certificate`,
                // Dynamic custom fields for this credential type (if any)
                extra: formData.extra || {},
            }
        };

        const response = await fetch(`${API_BASE_URL}/certificates/issue`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(certificateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to issue certificate');
        }

        return await response.json();
    },
};

