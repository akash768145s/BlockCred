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
        dob: "",
        school_name: "",
        photo: null as File | null,
        father_name: "",
        aadhar_number: "",
        tenth_school: "",
        tenth_marks: "",
        twelfth_school: "",
        twelfth_marks: "",
        twelfth_marksheet: null as File | null,
        cutoff: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const router = useRouter();
    const { register } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, files } = e.target as HTMLInputElement;
        setFormData({
            ...formData,
            [name]: files ? files[0] : value,
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
            dob: formData.dob,
            school_name: formData.school_name,
            photo: formData.photo,
            father_name: formData.father_name,
            aadhar_number: formData.aadhar_number,
            tenth_school: formData.tenth_school,
            tenth_marks: parseInt(formData.tenth_marks),
            twelfth_school: formData.twelfth_school,
            twelfth_marks: parseInt(formData.twelfth_marks),
            twelfth_marksheet: formData.twelfth_marksheet,
            cutoff: parseInt(formData.cutoff),
        });

        if (result.success) {
            setSuccess(result.message);
            // Reset form
            setFormData({
                name: "",
                email: "",
                phone: "",
                password: "",
                dob: "",
                school_name: "",
                photo: null,
                father_name: "",
                aadhar_number: "",
                tenth_school: "",
                tenth_marks: "",
                twelfth_school: "",
                twelfth_marks: "",
                twelfth_marksheet: null,
                cutoff: "",
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
                    <h1 className="text-h1 text-gray-900 mb-2">BlockCred</h1>
                    <p className="text-body text-gray-600">Student Registration</p>
                    <p className="text-small text-gray-500 mt-2">
                        Register to join the blockchain credential ecosystem
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-small font-weight-medium text-gray-700 mb-2">
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
                            <label htmlFor="phone" className="block text-small font-weight-medium text-gray-700 mb-2">
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
                            <label htmlFor="email" className="block text-small font-weight-medium text-gray-700 mb-2">
                                Email ID *
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
                            <label htmlFor="dob" className="block text-small font-weight-medium text-gray-700 mb-2">
                                Date of Birth *
                            </label>
                            <input
                                type="date"
                                id="dob"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="school_name" className="block text-small font-weight-medium text-gray-700 mb-2">
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
                            <label htmlFor="photo" className="block text-small font-weight-medium text-gray-700 mb-2">
                                Photo *
                            </label>
                            <input
                                type="file"
                                id="photo"
                                name="photo"
                                onChange={handleChange}
                                accept="image/*"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="father_name" className="block text-small font-weight-medium text-gray-700 mb-2">
                                Father Name *
                            </label>
                            <input
                                type="text"
                                id="father_name"
                                name="father_name"
                                value={formData.father_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your father's name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="aadhar_number" className="block text-small font-weight-medium text-gray-700 mb-2">
                                Aadhar Number *
                            </label>
                            <input
                                type="text"
                                id="aadhar_number"
                                name="aadhar_number"
                                value={formData.aadhar_number}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your Aadhar number"
                                pattern="[0-9]{12}"
                                maxLength={12}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="tenth_school" className="block text-small font-weight-medium text-gray-700 mb-2">
                                10th Grade School *
                            </label>
                            <select
                                id="tenth_school"
                                name="tenth_school"
                                value={formData.tenth_school}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                required
                            >
                                <option value="">Select your 10th school</option>
                                <option value="SSN School of Advanced Software Engineering">SSN School of Advanced Software Engineering</option>
                                <option value="SSN College of Engineering">SSN College of Engineering</option>
                                <option value="SSN School of Management">SSN School of Management</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="tenth_marks" className="block text-small font-weight-medium text-gray-700 mb-2">
                                10th Grade Marks (%) *
                            </label>
                            <select
                                id="tenth_marks"
                                name="tenth_marks"
                                value={formData.tenth_marks}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                required
                            >
                                <option value="">Select your 10th marks</option>
                                <option value="95">95% and above</option>
                                <option value="90">90-94%</option>
                                <option value="85">85-89%</option>
                                <option value="80">80-84%</option>
                                <option value="75">75-79%</option>
                                <option value="70">70-74%</option>
                                <option value="65">65-69%</option>
                                <option value="60">60-64%</option>
                                <option value="55">55-59%</option>
                                <option value="50">50-54%</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="twelfth_school" className="block text-small font-weight-medium text-gray-700 mb-2">
                                12th Grade School *
                            </label>
                            <select
                                id="twelfth_school"
                                name="twelfth_school"
                                value={formData.twelfth_school}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                required
                            >
                                <option value="">Select your 12th school</option>
                                <option value="SSN School of Advanced Software Engineering">SSN School of Advanced Software Engineering</option>
                                <option value="SSN College of Engineering">SSN College of Engineering</option>
                                <option value="SSN School of Management">SSN School of Management</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="twelfth_marks" className="block text-small font-weight-medium text-gray-700 mb-2">
                                12th Grade Marks (%) *
                            </label>
                            <input
                                type="number"
                                id="twelfth_marks"
                                name="twelfth_marks"
                                value={formData.twelfth_marks}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter your 12th marks"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="twelfth_marksheet" className="block text-small font-weight-medium text-gray-700 mb-2">
                                12th Mark Sheet (PDF) *
                            </label>
                            <input
                                type="file"
                                id="twelfth_marksheet"
                                name="twelfth_marksheet"
                                onChange={handleChange}
                                accept=".pdf"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="cutoff" className="block text-small font-weight-medium text-gray-700 mb-2">
                                Cut-off Marks *
                            </label>
                            <input
                                type="number"
                                id="cutoff"
                                name="cutoff"
                                value={formData.cutoff}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                                placeholder="Enter cut-off marks"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-small font-weight-medium text-gray-700 mb-2">
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
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-weight-medium"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-body text-gray-600">
                        Already have an account?{" "}
                        <button
                            onClick={() => router.push("/login")}
                            className="text-green-600 hover:text-green-700 font-weight-medium"
                        >
                            Login here
                        </button>
                    </p>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-weight-medium text-gray-900 mb-2">How it works:</h3>
                    <ol className="text-small text-gray-600 space-y-1">
                        <li>1. Fill out the registration form with your personal details and academic records</li>
                        <li>2. Select your 10th grade school and marks from the dropdown</li>
                        <li>3. Upload your photo and 12th mark sheet PDF</li>
                        <li>4. A unique Student ID will be generated based on your information</li>
                        <li>5. Admin will review and approve your registration</li>
                        <li>6. Once approved, a blockchain node will be assigned to you</li>
                        <li>7. Your credentials will be stored securely on the blockchain</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
