'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    GraduationCap,
    FileText,
    Award,
    Plus,
    Search,
    Eye,
    Download,
    CheckCircle,
    Clock,
    Users,
    BookOpen,
    TrendingUp,
    Shield
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
    purpose: string;
    issued_date: string;
    status: string;
    description: string;
}

const FacultyDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [students, setStudents] = useState<Student[]>([]);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showIssueCredential, setShowIssueCredential] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

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
            const response = await fetch('http://localhost:8080/api/credentials/all', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const allCredentials = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                const facultyCredentials = allCredentials.filter((cred: any) =>
                    cred.credential?.type === 'bonafide' ||
                    cred.credential?.type === 'noc' ||
                    cred.type === 'bonafide' ||
                    cred.type === 'noc'
                );
                setCredentials(facultyCredentials);
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
        return matchesSearch;
    });

    const filteredCredentials = (Array.isArray(credentials) ? credentials : []).filter(credential => {
        if (filterType === 'all') return true;
        return credential.type === filterType;
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
                            <p className="text-sm font-medium text-gray-600">Total Certificates</p>
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
                            <Shield className="h-5 w-5 text-blue-600" />
                            <span className="ml-2 font-medium text-gray-900">Issue NOC</span>
                        </div>
                        <p className="text-sm text-gray-600">Issue No Objection Certificate</p>
                    </button>

                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <span className="ml-2 font-medium text-gray-900">Issue Bonafide</span>
                        </div>
                        <p className="text-sm text-gray-600">Issue Bonafide Certificate</p>
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
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
                                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-green-600" />
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
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="noc">NOC</option>
                            <option value="bonafide">Bonafide</option>
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
                                    Purpose
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
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
                            {filteredCredentials.map((credential) => (
                                <tr key={credential.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{credential.title}</div>
                                        <div className="text-sm text-gray-500">{credential.type.toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.student_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.purpose}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(credential.issued_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${credential.status === 'issued' ? 'bg-green-100 text-green-800' :
                                            credential.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {credential.status}
                                        </span>
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
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading faculty dashboard...</p>
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
                            <GraduationCap className="h-8 w-8 text-green-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
                                <p className="text-gray-600">Manage student certificates and documents</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Department Faculty
                            </span>
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
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'credentials'
                                ? 'border-green-500 text-green-600'
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
        type: 'noc',
        title: '',
        purpose: '',
        description: '',
        valid_until: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const endpoint = formData.type === 'noc'
                ? 'http://localhost:8080/api/faculty/issue-noc'
                : 'http://localhost:8080/api/faculty/issue-bonafide';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
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
                        <h3 className="text-lg font-semibold">Issue Certificate</h3>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="noc">No Objection Certificate (NOC)</option>
                                    <option value="bonafide">Bonafide Certificate</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purpose *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.purpose}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Enter purpose of the certificate"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Enter additional details"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valid Until
                            </label>
                            <input
                                type="date"
                                value={formData.valid_until}
                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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

export default FacultyDashboard;
