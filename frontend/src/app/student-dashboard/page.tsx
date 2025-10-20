"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Certificate {
    id: number;
    type: string;
    title: string;
    institution: string;
    issued_date: string;
    status: string;
    description: string;
}

interface Student {
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
    certificates: Certificate[];
}

export default function StudentDashboard() {
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // Check if student is logged in
        const session = localStorage.getItem("student_session");
        if (!session) {
            router.push("/login");
            return;
        }

        const sessionData = JSON.parse(session);
        fetchStudentData(sessionData.user_id);
    }, [router]);

    const fetchStudentData = async (userId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/student/${userId}`);
            const data = await response.json();

            if (data.success) {
                setStudent(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to fetch student data");
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("student_session");
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

    if (error || !student) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || "Student not found"}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Login
                    </button>
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
                            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                            <p className="text-sm text-gray-600">Welcome, {student.name}</p>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Student ID Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Student ID Card</h2>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-blue-600">
                                    {student.name.charAt(0)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-blue-100 text-sm">Student ID</p>
                                <p className="text-xl font-mono font-bold">{student.student_id}</p>
                            </div>

                            <div>
                                <p className="text-blue-100 text-sm">Full Name</p>
                                <p className="text-lg font-semibold">{student.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">Email</p>
                                    <p className="text-sm">{student.email}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">Phone</p>
                                    <p className="text-sm">{student.phone}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">School</p>
                                    <p className="text-sm">{student.school_name}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">Passing Year</p>
                                    <p className="text-sm">{student.passing_year}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-blue-100 text-sm">10th Grade Marks</p>
                                <p className="text-lg font-semibold">{student.tenth_marks}%</p>
                            </div>

                            <div className="flex items-center space-x-4 pt-4 border-t border-blue-400">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                                    <span className="text-sm">Approved</span>
                                </div>
                                {student.node_assigned && (
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                                        <span className="text-sm">Blockchain Node Assigned</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Registration Status</span>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                        Approved
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Blockchain Node</span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {student.node_assigned ? 'Assigned' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Certificates</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                        {student.certificates.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Info</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>• Your credentials are stored on a private GoEth blockchain</p>
                                <p>• Each certificate is cryptographically secured</p>
                                <p>• Certificates can be verified by institutions</p>
                                <p>• Your data is decentralized and tamper-proof</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Certificates Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">My Certificates</h2>
                        <button
                            onClick={() => fetchStudentData(student.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    {student.certificates.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
                            <p className="text-gray-600">
                                Your certificates will appear here once they are issued by institutions.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {student.certificates.map((certificate) => (
                                <div key={certificate.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{certificate.title}</h3>
                                            <p className="text-sm text-gray-600">{certificate.institution}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${certificate.status === 'issued'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {certificate.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Type:</span>
                                            <span className="ml-2 capitalize">{certificate.type}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Issued:</span>
                                            <span className="ml-2">{certificate.issued_date}</span>
                                        </div>
                                        {certificate.description && (
                                            <div>
                                                <span className="text-gray-500">Description:</span>
                                                <p className="ml-2 text-gray-700">{certificate.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
