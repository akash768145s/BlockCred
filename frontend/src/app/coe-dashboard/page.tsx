'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText,
    GraduationCap,
    Award,
    Plus,
    Search,
    Filter,
    Eye,
    Download,
    CheckCircle,
    Clock,
    Users,
    BookOpen,
    TrendingUp,
    XCircle
} from 'lucide-react';

interface Student {
    id: number;
    name: string;
    student_id: string;
    email: string;
    department: string;
    semester: string;
    is_active: boolean;
}

interface Credential {
    id: number;
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
}

const COEDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [students, setStudents] = useState<Student[]>([]);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showIssueCredential, setShowIssueCredential] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSemester, setFilterSemester] = useState('all');

    useEffect(() => {
        fetchStudents();
        fetchCredentials();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Ensure we have an array and filter only students
                const allUsers = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                const studentUsers = allUsers.filter((user: any) => user.role === 'student');
                setStudents(studentUsers);
            } else {
                console.error('Failed to fetch students:', response.statusText);
                setStudents([]);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCredentials = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/certificates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Ensure we have an array and filter only marksheet credentials
                const allCredentials = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                const marksheetCredentials = allCredentials.filter((cert: any) =>
                    cert.cert_type === 'marksheet' || cert.cert_type === 'degree'
                );
                setCredentials(marksheetCredentials);
            } else {
                console.error('Failed to fetch credentials:', response.statusText);
                setCredentials([]);
            }
        } catch (error) {
            console.error('Error fetching credentials:', error);
            setCredentials([]);
        }
    };

    const filteredStudents = (Array.isArray(students) ? students : []).filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSemester = filterSemester === 'all' || student.semester === filterSemester;
        return matchesSearch && matchesSemester;
    });

    const stats = {
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalCredentials: Array.isArray(credentials) ? credentials.length : 0,
        issuedToday: Array.isArray(credentials) ? credentials.filter(c => {
            const today = new Date().toISOString().split('T')[0];
            return c.issued_date === today;
        }).length : 0,
        pendingVerification: Array.isArray(credentials) ? credentials.filter(c => c.status === 'pending').length : 0
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Credentials</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalCredentials}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Issued Today</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.issuedToday}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingVerification}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="ml-2 font-medium text-gray-900">Issue Marksheet</span>
                        </div>
                        <p className="text-sm text-gray-600">Issue semester marksheet for students</p>
                    </button>

                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                            <span className="ml-2 font-medium text-gray-900">Issue Degree Certificate</span>
                        </div>
                        <p className="text-sm text-gray-600">Issue degree certificates for graduates</p>
                    </button>

                    <button
                        onClick={() => setActiveTab('students')}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <Users className="h-5 w-5 text-purple-600" />
                            <span className="ml-2 font-medium text-gray-900">View Students</span>
                        </div>
                        <p className="text-sm text-gray-600">Browse and manage student records</p>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStudents = () => (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Semesters</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="6">Semester 6</option>
                            <option value="7">Semester 7</option>
                            <option value="8">Semester 8</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Issue Credential
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Semester
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.student_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.department}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        Semester {student.semester}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {student.is_active ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-yellow-500" />
                                            )}
                                            <span className={`text-sm ${student.is_active ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {student.is_active ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowIssueCredential(true)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderCredentials = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issued Credentials</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Credential
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Semester
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Marks/Grade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {credentials.map((credential) => (
                                <tr key={credential.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{credential.title || (credential.cert_type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                        <div className="text-sm text-gray-500">{(credential.cert_type || credential.type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.student_name || credential.metadata?.student_name || 'Unknown Student'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.semester || credential.metadata?.semester || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.subject || credential.metadata?.course || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">{credential.marks || credential.metadata?.cgpa || 'N/A'}</span>
                                            <span className="text-gray-500">({credential.grade || credential.metadata?.grade || 'N/A'})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(credential.issued_date || credential.issued_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button className="text-green-600 hover:text-green-900">
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading COE dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">COE Dashboard</h1>
                                <p className="text-gray-600">Manage academic credentials and results</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                Controller of Examinations
                            </span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    router.push('/login');
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'credentials'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Credentials
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'students' && renderStudents()}
                {activeTab === 'credentials' && renderCredentials()}
            </div>

            {/* Issue Credential Modal */}
            {showIssueCredential && (
                <IssueCredentialModal
                    onClose={() => setShowIssueCredential(false)}
                    onCredentialIssued={() => {
                        setShowIssueCredential(false);
                        fetchCredentials();
                    }}
                    students={students}
                />
            )}
        </div>
    );
};

// Subject interface
interface Subject {
    id: string;
    subject_code: string;
    subject_name: string;
    marks: string;
    grade: string;
    credits: string;
}

// Issue Credential Modal Component
const IssueCredentialModal: React.FC<{
    onClose: () => void;
    onCredentialIssued: () => void;
    students: Student[];
}> = ({ onClose, onCredentialIssued, students }) => {
    const [formData, setFormData] = useState({
        student_id: '',
        type: 'marksheet',
        semester: '',
        cgpa: ''
    });
    const [subjects, setSubjects] = useState<Subject[]>([
        { id: '1', subject_code: '', subject_name: '', marks: '', grade: '', credits: '' }
    ]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
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

            // Convert to base64
            const base64Content = btoa(samplePdfContent);

            // Validate subjects
            const validSubjects = subjects.filter(s => 
                s.subject_code.trim() && s.subject_name.trim() && s.marks.trim() && s.credits.trim()
            );
            
            if (validSubjects.length === 0) {
                alert('Please add at least one subject with all required fields');
                setLoading(false);
                return;
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

            const certificateData = {
                student_id: formData.student_id,
                cert_type: formData.type === 'degree' ? 'degree' : 'marksheet',
                file_data: base64Content,
                file_name: `${formData.type}_${formData.student_id}_${Date.now()}.pdf`,
                metadata: {
                    student_name: students.find(s => s.student_id === formData.student_id)?.name || 'Unknown Student',
                    student_email: students.find(s => s.student_id === formData.student_id)?.email || '',
                    issuer_name: 'COE Office',
                    issuer_role: 'coe',
                    institution: 'SSN College of Engineering',
                    course: students.find(s => s.student_id === formData.student_id)?.department || 'Computer Science',
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

            const response = await fetch('http://localhost:8080/api/certificates/issue', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(certificateData),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Certificate issued successfully!\nCertificate ID: ${result.data.cert_id}\nIPFS URL: ${result.data.ipfs_url}`);
                onCredentialIssued();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error issuing certificate:', error);
            alert('Failed to issue certificate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-[#1E293B]">Issue Academic Credential</h3>
                            <p className="text-sm text-[#64748B] mt-1">Fill in the details to issue a new credential</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-2 hover:bg-[#F8FAFC] rounded-lg"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Student <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                >
                                    <option value="" className="text-[#94A3B8]">Select Student</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.student_id} className="text-[#1E293B]">
                                            {student.name} ({student.student_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Credential Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                >
                                    <option value="marksheet" className="text-[#1E293B]">Semester Marksheet</option>
                                    <option value="degree" className="text-[#1E293B]">Degree Certificate</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Semester <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                >
                                    <option value="" className="text-[#94A3B8]">Select Semester</option>
                                    <option value="1" className="text-[#1E293B]">Semester 1</option>
                                    <option value="2" className="text-[#1E293B]">Semester 2</option>
                                    <option value="3" className="text-[#1E293B]">Semester 3</option>
                                    <option value="4" className="text-[#1E293B]">Semester 4</option>
                                    <option value="5" className="text-[#1E293B]">Semester 5</option>
                                    <option value="6" className="text-[#1E293B]">Semester 6</option>
                                    <option value="7" className="text-[#1E293B]">Semester 7</option>
                                    <option value="8" className="text-[#1E293B]">Semester 8</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    CGPA <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    value={formData.cgpa}
                                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter CGPA (0-10)"
                                />
                                <p className="text-xs text-[#64748B] mt-1">Range: 0.00 - 10.00</p>
                            </div>
                        </div>

                        {/* Subjects Section */}
                            <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-semibold text-[#1E293B]">
                                    Subjects <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubjects([...subjects, {
                                            id: Date.now().toString(),
                                            subject_code: '',
                                            subject_name: '',
                                            marks: '',
                                            grade: '',
                                            credits: ''
                                        }]);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Subject
                                </button>
                            </div>

                            {/* Subjects Table */}
                            <div className="border-2 border-[#06B6D4]/20 rounded-lg overflow-hidden shadow-sm bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-[#06B6D4] to-[#0891B2]">
                                            <tr>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[15%]">Subject Code</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[30%]">Subject Name</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Marks</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[15%]">Grade</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Credits</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {subjects.map((subject, index) => (
                                                <tr key={subject.id} className="hover:bg-[#F0FDFF] transition-colors bg-white">
                                                    <td className="px-6 py-3 bg-white">
                                <input
                                    type="text"
                                    required
                                                            value={subject.subject_code}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].subject_code = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[140px] px-4 py-2.5 bg-white border-2 border-gray-200 rounded-md text-sm text-[#1E293B] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                                            placeholder="e.g., CS101"
                                />
                                                    </td>
                                                    <td className="px-6 py-3 bg-white">
                                <input
                                    type="text"
                                                            required
                                                            value={subject.subject_name}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].subject_name = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[280px] px-4 py-2.5 bg-white border-2 border-gray-200 rounded-md text-sm text-[#1E293B] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                                            placeholder="e.g., Data Structures"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 bg-white">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            max="100"
                                                            value={subject.marks}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].marks = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[120px] px-4 py-2.5 bg-white border-2 border-gray-200 rounded-md text-sm text-[#1E293B] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                                            placeholder="0-100"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 bg-white">
                                                        <select
                                                            value={subject.grade}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].grade = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[140px] px-4 py-2.5 bg-white border-2 border-gray-200 rounded-md text-sm text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                                        >
                                                            <option value="" className="text-gray-400">Select</option>
                                                            <option value="S" className="text-[#1E293B]">S (10)</option>
                                                            <option value="A+" className="text-[#1E293B]">A+ (9)</option>
                                                            <option value="A" className="text-[#1E293B]">A (8)</option>
                                                            <option value="B+" className="text-[#1E293B]">B+ (7)</option>
                                                            <option value="B" className="text-[#1E293B]">B (6)</option>
                                                            <option value="C+" className="text-[#1E293B]">C+ (5)</option>
                                                            <option value="C" className="text-[#1E293B]">C (4)</option>
                                                            <option value="D" className="text-[#1E293B]">D (3)</option>
                                                            <option value="F" className="text-[#1E293B]">F (0)</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-3 bg-white">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            max="10"
                                                            step="0.5"
                                                            value={subject.credits}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].credits = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[120px] px-4 py-2.5 bg-white border-2 border-gray-200 rounded-md text-sm text-[#1E293B] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                                            placeholder="e.g., 3"
                                />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            </div>
                        </div>
                            <p className="text-xs text-[#64748B] mt-2">Add multiple subjects using the "+" button above</p>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t border-[#E2E8F0]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] hover:bg-[#F8FAFC] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-[#06B6D4] text-white rounded-lg hover:bg-[#0891B2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                            >
                                {loading ? 'Issuing...' : 'Issue Credential'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default COEDashboard;
