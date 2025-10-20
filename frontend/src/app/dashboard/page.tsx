"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    student_id: string;
    tenth_marks: number;
    school_name: string;
    passing_year: number;
    is_approved: boolean;
    node_assigned: boolean;
    created_at: string;
}

export default function DashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [approving, setApproving] = useState<number | null>(null);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [certificateForm, setCertificateForm] = useState({
        type: "",
        title: "",
        institution: "",
        description: "",
    });
    const [issuingCertificate, setIssuingCertificate] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if admin is logged in
        const session = localStorage.getItem("admin_session");
        if (!session) {
            router.push("/login");
            return;
        }

        fetchUsers();
        fetchMetrics();
    }, [router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/users");
            const data = await response.json();

            if (data.success) {
                setUsers(data.data || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const fetchMetrics = async () => {
        setMetricsLoading(true);
        try {
            const response = await fetch("http://localhost:8080/api/metrics/dashboard");
            const data = await response.json();

            if (data.success) {
                setMetrics(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch metrics:", err);
        } finally {
            setMetricsLoading(false);
        }
    };

    const approveUser = async (userId: number) => {
        setApproving(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/users/${userId}/approve`, {
                method: "POST",
            });
            const data = await response.json();

            if (data.success) {
                // Update the user in the local state
                setUsers(users.map(user =>
                    user.id === userId
                        ? { ...user, is_approved: true, node_assigned: true }
                        : user
                ));
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to approve user");
        } finally {
            setApproving(null);
        }
    };

    const openCertificateModal = (user: User) => {
        setSelectedStudent(user);
        setShowCertificateModal(true);
        setCertificateForm({
            type: "",
            title: "",
            institution: "",
            description: "",
        });
    };

    const closeCertificateModal = () => {
        setShowCertificateModal(false);
        setSelectedStudent(null);
        setCertificateForm({
            type: "",
            title: "",
            institution: "",
            description: "",
        });
    };

    const issueCertificate = async () => {
        if (!selectedStudent) return;

        setIssuingCertificate(true);
        try {
            const response = await fetch("http://localhost:8080/api/certificates/issue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    student_id: selectedStudent.student_id,
                    type: certificateForm.type,
                    title: certificateForm.title,
                    institution: certificateForm.institution,
                    description: certificateForm.description,
                }),
            });

            const data = await response.json();

            if (data.success) {
                closeCertificateModal();
                fetchUsers(); // Refresh the users list
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to issue certificate");
        } finally {
            setIssuingCertificate(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("admin_session");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">BlockCred Admin</h1>
                            <p className="text-sm text-gray-600">Blockchain Credential Management</p>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">User Registration Requests</h2>
                    <p className="text-gray-600">Review and approve student registrations to assign blockchain nodes</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Monitoring Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">System Monitoring</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={fetchMetrics}
                                disabled={metricsLoading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {metricsLoading ? 'Refreshing...' : 'Refresh Metrics'}
                            </button>
                            <a
                                href="http://localhost:9090"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Prometheus
                            </a>
                            <a
                                href="http://localhost:3001"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Grafana
                            </a>
                        </div>
                    </div>

                    {metrics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                                <p className="text-2xl font-bold text-gray-900">{metrics.total_users}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-sm font-medium text-gray-500">Approved Users</h3>
                                <p className="text-2xl font-bold text-green-600">{metrics.approved_users}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-sm font-medium text-gray-500">Pending Users</h3>
                                <p className="text-2xl font-bold text-orange-600">{metrics.pending_users}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-sm font-medium text-gray-500">Active Nodes</h3>
                                <p className="text-2xl font-bold text-purple-600">{metrics.active_nodes}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-sm font-medium text-gray-500">Certificates</h3>
                                <p className="text-2xl font-bold text-blue-600">{metrics.total_certificates}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Approved Users</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {users.filter(user => user.is_approved).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Pending Approval</h3>
                        <p className="text-2xl font-bold text-orange-600">
                            {users.filter(user => !user.is_approved).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Blockchain Nodes</h3>
                        <p className="text-2xl font-bold text-purple-600">
                            {users.filter(user => user.node_assigned).length}
                        </p>
                        <div className="flex items-center mt-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-500">GoEth Network Active</span>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Academic Info
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
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            No users registered yet
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                    <div className="text-sm text-gray-500">{user.phone}</div>
                                                    <div className="text-xs text-blue-600 font-mono">ID: {user.student_id}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm text-gray-900">{user.school_name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.passing_year} • {user.tenth_marks}% marks
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_approved
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {user.is_approved ? 'Approved' : 'Pending'}
                                                    </span>
                                                    {user.node_assigned && (
                                                        <div>
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                Node Assigned
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="space-y-2">
                                                    {!user.is_approved ? (
                                                        <button
                                                            onClick={() => approveUser(user.id)}
                                                            disabled={approving === user.id}
                                                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {approving === user.id ? 'Approving...' : 'Approve & Assign Node'}
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <div className="text-green-600 font-medium mb-2">✓ Approved</div>
                                                            <button
                                                                onClick={() => openCertificateModal(user)}
                                                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                                            >
                                                                Issue Certificate
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Info Sections */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* How System Works */}
                    <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="font-medium text-blue-900 mb-2">How the System Works:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Students register with their 10th marksheet details</li>
                            <li>• System generates unique Student ID based on academic information</li>
                            <li>• Admin reviews and approves registrations</li>
                            <li>• Upon approval, a GoEth blockchain node is assigned to the student</li>
                            <li>• Future credentials (certificates, bonafides) will be stored on their assigned node</li>
                        </ul>
                    </div>

                    {/* Blockchain Info */}
                    <div className="bg-purple-50 rounded-lg p-6">
                        <h3 className="font-medium text-purple-900 mb-2">Blockchain Infrastructure:</h3>
                        <ul className="text-sm text-purple-800 space-y-1">
                            <li>• Credentials are stored on a private GoEth blockchain</li>
                            <li>• Each certificate is cryptographically secured</li>
                            <li>• Certificates can be verified by institutions</li>
                            <li>• Student data is decentralized and tamper-proof</li>
                            <li>• Proof of Authority (PoA) consensus mechanism</li>
                            <li>• Each student gets a dedicated blockchain node</li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* Certificate Modal */}
            {showCertificateModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Issue Certificate
                            </h3>
                            <button
                                onClick={closeCertificateModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Issuing certificate for:</p>
                            <p className="font-medium">{selectedStudent.name}</p>
                            <p className="text-sm text-gray-500">ID: {selectedStudent.student_id}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certificate Type *
                                </label>
                                <select
                                    value={certificateForm.type}
                                    onChange={(e) => setCertificateForm({ ...certificateForm, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select type</option>
                                    <option value="degree">Degree Certificate</option>
                                    <option value="diploma">Diploma Certificate</option>
                                    <option value="bonafide">Bonafide Certificate</option>
                                    <option value="marksheet">Marksheet</option>
                                    <option value="transcript">Transcript</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certificate Title *
                                </label>
                                <input
                                    type="text"
                                    value={certificateForm.title}
                                    onChange={(e) => setCertificateForm({ ...certificateForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Bachelor of Computer Science"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Institution Name *
                                </label>
                                <input
                                    type="text"
                                    value={certificateForm.institution}
                                    onChange={(e) => setCertificateForm({ ...certificateForm, institution: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., XYZ University"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={certificateForm.description}
                                    onChange={(e) => setCertificateForm({ ...certificateForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Additional details about the certificate"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={closeCertificateModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={issueCertificate}
                                disabled={issuingCertificate || !certificateForm.type || !certificateForm.title || !certificateForm.institution}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {issuingCertificate ? 'Issuing...' : 'Issue Certificate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
