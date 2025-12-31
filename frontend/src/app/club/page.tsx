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
    Star,
    XCircle
} from 'lucide-react';
import { useClub } from '@/hooks/useClub';
import { Student } from '@/types/dashboard';
import { clubService } from '@/services/clubService';

const ClubDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const { students, credentials, loading, fetchCredentials } = useClub();
    const [showIssueCredential, setShowIssueCredential] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEvent, setFilterEvent] = useState('all');

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
            const issuedDate = (c as any).issued_date || (c as any).issued_at;
            if (!issuedDate) return false;
            const dateStr = typeof issuedDate === 'string'
                ? issuedDate.split('T')[0]
                : new Date(issuedDate).toISOString().split('T')[0];
            return dateStr === today;
        }).length : 0,
        pendingVerification: Array.isArray(credentials) ? credentials.filter(c => c.status === 'pending').length : 0
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Users className="h-7 w-7 text-blue-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Students</p>
                        <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Award className="h-7 w-7 text-purple-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Certificates</p>
                        <p className="text-2xl font-bold text-white">{stats.totalCertificates}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <TrendingUp className="h-7 w-7 text-green-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Issued Today</p>
                        <p className="text-2xl font-bold text-white">{stats.issuedToday}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Clock className="h-7 w-7 text-yellow-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Pending Verification</p>
                        <p className="text-2xl font-bold text-white">{stats.pendingVerification}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <Trophy className="h-5 w-5 text-blue-400" />
                            <span className="ml-2 font-medium text-white">Issue Participation Certificate</span>
                        </div>
                        <p className="text-sm text-slate-300">Issue certificate for event participation</p>
                    </button>

                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <Star className="h-5 w-5 text-green-400" />
                            <span className="ml-2 font-medium text-white">Issue Achievement Certificate</span>
                        </div>
                        <p className="text-sm text-slate-300">Issue certificate for achievements</p>
                    </button>

                    <button
                        onClick={() => setActiveTab('students')}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <Users className="h-5 w-5 text-purple-400" />
                            <span className="ml-2 font-medium text-white">View Students</span>
                        </div>
                        <p className="text-sm text-slate-300">Browse and manage student records</p>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStudents = () => (
        <div className="space-y-6">
            {/* Search */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg text-white placeholder-slate-400 bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/20"
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
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Student ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Semester
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-white/10">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                                    <Users className="h-5 w-5 text-purple-400" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{student.name}</div>
                                                <div className="text-sm text-slate-400">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {student.student_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {student.department}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        Semester {student.semester}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {student.is_active ? (
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-yellow-400" />
                                            )}
                                            <span className={`text-sm ${student.is_active ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {student.is_active ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button className="text-blue-400 hover:text-blue-300">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowIssueCredential(true)}
                                                className="text-purple-400 hover:text-purple-300"
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
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search certificates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg text-white placeholder-slate-400 bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/20"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterEvent}
                            onChange={(e) => setFilterEvent(e.target.value)}
                            className="w-full px-3 py-2 border border-white/20 rounded-lg text-white bg-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Certificate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Position
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-white/10">
                            {filteredCredentials.map((credential) => (
                                <tr key={credential.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{(credential as any).title || ((credential as any).cert_type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                        <div className="text-sm text-slate-400">{((credential as any).cert_type || (credential as any).type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {(credential as any).student_name || credential.metadata?.student_name || 'Unknown Student'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {(credential as any).event_name || credential.metadata?.event_name || ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            {(credential as any).position || credential.metadata?.position || 'Participant'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {(credential as any).issued_date || credential.issued_at ? new Date((credential as any).issued_date || credential.issued_at).toLocaleDateString() : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            {credential.ipfs_url && (
                                                <a
                                                    href={credential.ipfs_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300"
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
                                                    className="text-green-400 hover:text-green-300"
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
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading club dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shadow-lg">
                            <Award className="h-6 w-6 text-purple-300" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold">BlockCred</p>
                            <h1 className="text-xl font-semibold text-white mt-1">Club Coordinator Dashboard</h1>
                            <p className="text-xs text-indigo-200">Manage participation certificates & achievements</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-purple-200 border border-white/20">
                            Club Coordinator
                        </span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                router.push('/login');
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'overview'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'students'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'credentials'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Certificates
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </main>
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
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowStudentDropdown(false);
            }
        };

        if (showStudentDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStudentDropdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await clubService.issueCertificate(formData);
            alert(`Certificate issued successfully!\nCertificate ID: ${result.data.cert_id}\nIPFS URL: ${result.data.ipfs_url}`);
            onCertificateIssued();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to issue certificate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white">Issue Participation Certificate</h3>
                            <p className="text-sm text-slate-300 mt-1">Fill in the details to issue a new certificate</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Student <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={studentSearch || students.find(s => s.student_id === formData.student_id)?.name || ''}
                                        onChange={(e) => {
                                            setStudentSearch(e.target.value);
                                            setShowStudentDropdown(true);
                                            if (!e.target.value) {
                                                setFormData({ ...formData, student_id: '' });
                                            }
                                        }}
                                        onFocus={() => setShowStudentDropdown(true)}
                                        placeholder="Search student by name or ID..."
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                    />
                                    {showStudentDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {students
                                                .filter(student =>
                                                    !studentSearch ||
                                                    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                    student.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                    student.email.toLowerCase().includes(studentSearch.toLowerCase())
                                                )
                                                .map(student => (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, student_id: student.student_id });
                                                            setStudentSearch(student.name);
                                                            setShowStudentDropdown(false);
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                                                    >
                                                        <div className="text-white font-medium">{student.name}</div>
                                                        <div className="text-sm text-slate-400">{student.student_id} • {student.email}</div>
                                                    </button>
                                                ))
                                            }
                                            {students.filter(student =>
                                                !studentSearch ||
                                                student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                student.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                student.email.toLowerCase().includes(studentSearch.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="px-4 py-3 text-slate-400 text-sm">No students found</div>
                                                )}
                                        </div>
                                    )}
                                </div>
                                {formData.student_id && (
                                    <input type="hidden" name="student_id" value={formData.student_id} required />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Certificate Type <span className="text-red-400">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                >
                                    <option value="participation_cert" className="text-white bg-slate-800">Participation Certificate</option>
                                    <option value="achievement_cert" className="text-white bg-slate-800">Achievement Certificate</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Event Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.event_name}
                                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                    placeholder="Enter event name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Position/Achievement
                                </label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                    placeholder="e.g., 1st Place, Participant, Winner"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                Event Date
                            </label>
                            <input
                                type="date"
                                value={formData.event_date}
                                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all resize-none"
                                placeholder="Enter event details and achievements"
                            />
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border-2 border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
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
