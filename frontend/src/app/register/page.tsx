"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        tenth_marks: "",
        school_name: "",
        passing_year: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const router = useRouter();
    const { register } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const result = await register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            tenth_marks: parseInt(formData.tenth_marks),
            school_name: formData.school_name,
            passing_year: parseInt(formData.passing_year),
        });

        if (result.success) {
            setSuccess(result.message);
            // Reset form
            setFormData({
                name: "",
                email: "",
                phone: "",
                password: "",
                tenth_marks: "",
                school_name: "",
                passing_year: "",
            });
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">BlockCred</h1>
                    <p className="text-gray-600">Student Registration</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Register to join the blockchain credential ecosystem
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your phone number"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="tenth_marks" className="block text-sm font-medium text-gray-700 mb-2">
                                10th Grade Marks (%) *
                            </label>
                            <input
                                type="number"
                                id="tenth_marks"
                                name="tenth_marks"
                                value={formData.tenth_marks}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your 10th marks"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-2">
                                School Name *
                            </label>
                            <input
                                type="text"
                                id="school_name"
                                name="school_name"
                                value={formData.school_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your school name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="passing_year" className="block text-sm font-medium text-gray-700 mb-2">
                                Passing Year *
                            </label>
                            <input
                                type="number"
                                id="passing_year"
                                name="passing_year"
                                value={formData.passing_year}
                                onChange={handleChange}
                                min="2000"
                                max="2030"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter passing year"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{" "}
                        <button
                            onClick={() => router.push("/login")}
                            className="text-green-600 hover:text-green-700 font-medium"
                        >
                            Login here
                        </button>
                    </p>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">How it works:</h3>
                    <ol className="text-sm text-gray-600 space-y-1">
                        <li>1. Fill out the registration form with your 10th marksheet details</li>
                        <li>2. A unique Student ID will be generated based on your information</li>
                        <li>3. Admin will review and approve your registration</li>
                        <li>4. Once approved, a blockchain node will be assigned to you</li>
                        <li>5. Your credentials will be stored securely on the blockchain</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
