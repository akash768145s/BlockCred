'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Award,
    FileText,
    Trophy,
    Plus,
    Search,
    Eye,
    Download,
    CheckCircle,
    Clock,
    Users,
    Calendar,
    TrendingUp,
    Star
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

const ClubDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [students, setStudents] = useState<Student[]>([]);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showIssueCredential, setShowIssueCredential] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEvent, setFilterEvent] = useState('all');

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
                const allCertificates = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                const clubCertificates = allCertificates.filter((cert: any) =>
                    cert.cert_type === 'participation_cert'
                );
                setCredentials(clubCertificates);
            } else {
                console.error('Failed to fetch certificates:', response.statusText);
                setCredentials([]);
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
            setCredentials([]);
        }
    };

    const filteredStudents = (Array.isArray(students) ? students : []).filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredCredentials = (Array.isArray(credentials) ? credentials : []).filter(credential => {
        if (filterEvent === 'all') return true;
        return credential.event_name.toLowerCase().includes(filterEvent.toLowerCase());
    });

    const stats = {
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalCertificates: Array.isArray(credentials) ? credentials.length : 0,
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
                        <Award className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalCertificates}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-600" />
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
                            <Trophy className="h-5 w-5 text-blue-600" />
                            <span className="ml-2 font-medium text-gray-900">Issue Participation Certificate</span>
                        </div>
                        <p className="text-sm text-gray-600">Issue certificate for event participation</p>
                    </button>

                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <Star className="h-5 w-5 text-green-600" />
                            <span className="ml-2 font-medium text-gray-900">Issue Achievement Certificate</span>
                        </div>
                        <p className="text-sm text-gray-600">Issue certificate for achievements</p>
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
            {/* Search */}
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
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Issue Certificate
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
                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-purple-600" />
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
                                                className="text-purple-600 hover:text-purple-900"
                                            >
                                                <Award className="h-4 w-4" />
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
            {/* Filter */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search certificates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterEvent}
                            onChange={(e) => setFilterEvent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Events</option>
                            <option value="coding">Coding Events</option>
                            <option value="sports">Sports Events</option>
                            <option value="cultural">Cultural Events</option>
                            <option value="technical">Technical Events</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Certificates Table */}
            <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Certificate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Position
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
                            {filteredCredentials.map((credential) => (
                                <tr key={credential.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{credential.title || (credential.cert_type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                        <div className="text-sm text-gray-500">{(credential.cert_type || credential.type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.student_name || credential.metadata?.student_name || 'Unknown Student'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.event_name || credential.metadata?.event_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                            {credential.position || credential.metadata?.position || 'Participant'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(credential.issued_date || credential.issued_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            {credential.ipfs_url && (
                                                <a
                                                    href={credential.ipfs_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Certificate"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                            )}
                                            {credential.cert_id && (
                                                <button
                                                    onClick={() => {
                                                        fetch(`http://localhost:8080/api/certificates/verify/${credential.cert_id}`)
                                                            .then(res => res.json())
                                                            .then(data => {
                                                                if (data.success && data.data.is_valid) {
                                                                    const studentName = data.data.metadata?.student_name || 'Unknown Student';
                                                                    const issuerName = data.data.metadata?.issuer_name || 'Unknown Issuer';
                                                                    alert(`✅ Certificate is valid!\n\nStudent: ${studentName}\nIssuer: ${issuerName}\nType: ${data.data.cert_type}\nStatus: ${data.data.status}`);
                                                                } else {
                                                                    alert(`❌ Certificate verification failed: ${data.message}`);
                                                                }
                                                            })
                                                            .catch(err => alert('Failed to verify certificate'));
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Verify Certificate"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            )}
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
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading club dashboard...</p>
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
                            <Award className="h-8 w-8 text-purple-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Club Coordinator Dashboard</h1>
                                <p className="text-gray-600">Manage participation certificates and achievements</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                Club Coordinator
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
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'credentials'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Certificates
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

            {/* Issue Certificate Modal */}
            {showIssueCredential && (
                <IssueCertificateModal
                    onClose={() => setShowIssueCredential(false)}
                    onCertificateIssued={() => {
                        setShowIssueCredential(false);
                        fetchCredentials();
                    }}
                    students={students}
                />
            )}
        </div>
    );
};

// Issue Certificate Modal Component
const IssueCertificateModal: React.FC<{
    onClose: () => void;
    onCertificateIssued: () => void;
    students: Student[];
}> = ({ onClose, onCertificateIssued, students }) => {
    const [formData, setFormData] = useState({
        student_id: '',
        type: 'participation_cert',
        title: '',
        event_name: '',
        position: '',
        description: '',
        event_date: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            // Create a sample PDF file for participation certificate
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
/Length 120
>>
stream
BT
/F1 12 Tf
72 720 Td
(PARTICIPATION CERTIFICATE) Tj
0 -20 Td
(Student: ${formData.student_id}) Tj
0 -20 Td
(Event: ${formData.event_name}) Tj
0 -20 Td
(Position: ${formData.position}) Tj
0 -20 Td
(Date: ${formData.event_date}) Tj
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
373
%%EOF`;

            // Convert to base64
            const base64Content = btoa(samplePdfContent);

            const certificateData = {
                student_id: formData.student_id,
                cert_type: 'participation_cert',
                file_data: base64Content,
                file_name: `participation_${formData.student_id}_${Date.now()}.pdf`,
                metadata: {
                    student_name: students.find(s => s.student_id === formData.student_id)?.name || 'Unknown Student',
                    student_email: students.find(s => s.student_id === formData.student_id)?.email || '',
                    issuer_name: 'Club Coordinator',
                    issuer_role: 'club_coordinator',
                    institution: 'SSN College of Engineering',
                    course: students.find(s => s.student_id === formData.student_id)?.department || 'Computer Science',
                    academic_year: '2024-25',
                    event_name: formData.event_name,
                    position: formData.position,
                    event_date: formData.event_date,
                    valid_from: new Date().toISOString(),
                    valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    description: formData.description || `Participation certificate for ${formData.event_name}`
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
                onCertificateIssued();
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Issue Participation Certificate</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student *
                                </label>
                                <select
                                    required
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select Student</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.student_id}>
                                            {student.name} ({student.student_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Certificate Type *
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="participation_cert">Participation Certificate</option>
                                    <option value="achievement_cert">Achievement Certificate</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Event Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.event_name}
                                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter event name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Position/Achievement
                                </label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., 1st Place, Participant, Winner"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Event Date
                            </label>
                            <input
                                type="date"
                                value={formData.event_date}
                                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter event details and achievements"
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading ? 'Issuing...' : 'Issue Certificate'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClubDashboard;
