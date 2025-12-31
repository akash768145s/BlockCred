import { Student, COECredential, IssueCredentialFormData, Subject } from '@/types/dashboard';

const API_BASE_URL = 'http://localhost:8080/api';

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const coeService = {
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

    async fetchCredentials(): Promise<COECredential[]> {
        const response = await fetch(`${API_BASE_URL}/certificates`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch credentials: ${response.statusText}`);
        }

        const data = await response.json();
        const allCredentials = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        return allCredentials.filter((cert: any) =>
            cert.cert_type === 'marksheet' || cert.cert_type === 'degree'
        );
    },

    async issueCredential(formData: IssueCredentialFormData, subjects: Subject[]): Promise<any> {
        const token = localStorage.getItem('token');

        // Create a sample PDF file (in real implementation, this would be a file upload)
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
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Semester ${formData.semester} Marksheet - ${formData.student_id}) Tj
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
297
%%EOF`;

        const base64Content = btoa(samplePdfContent);

        // Validate subjects
        const validSubjects = subjects.filter(s =>
            s.subject_code.trim() && s.subject_name.trim() && s.marks.trim() && s.credits.trim()
        );

        if (validSubjects.length === 0) {
            throw new Error('Please add at least one subject with all required fields');
        }

        // Calculate total credits and weighted GPA
        let totalCredits = 0;
        let totalPoints = 0;
        const gradePoints: { [key: string]: number } = {
            'S': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C+': 5, 'C': 4, 'D': 3, 'F': 0
        };

        validSubjects.forEach(subject => {
            const credits = parseFloat(subject.credits) || 0;
            const points = gradePoints[subject.grade.toUpperCase()] || 0;
            totalCredits += credits;
            totalPoints += points * credits;
        });

        const calculatedCGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : formData.cgpa;

        // Get student info
        const students = await this.fetchStudents();
        const student = students.find(s => s.student_id === formData.student_id);

        const certificateData = {
            student_id: formData.student_id,
            cert_type: formData.type === 'degree' ? 'degree' : 'marksheet',
            file_data: base64Content,
            file_name: `${formData.type}_${formData.student_id}_${Date.now()}.pdf`,
            metadata: {
                student_name: student?.name || 'Unknown Student',
                student_email: student?.email || '',
                issuer_name: 'COE Office',
                issuer_role: 'coe',
                institution: 'SSN College of Engineering',
                course: student?.department || 'Computer Science',
                semester: formData.semester,
                academic_year: '2024-25',
                cgpa: parseFloat(formData.cgpa || calculatedCGPA) || 0,
                valid_from: new Date().toISOString(),
                valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                description: `${formData.type} certificate`,
                subjects: validSubjects.map(s => ({
                    subject_code: s.subject_code,
                    subject_name: s.subject_name,
                    marks: parseFloat(s.marks) || 0,
                    grade: s.grade,
                    credits: parseFloat(s.credits) || 0
                }))
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

