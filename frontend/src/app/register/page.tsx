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
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4 py-12">
            <div className="max-w-2xl w-full rounded-3xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-2xl p-8">
                <div className="text-center mb-8">
                    <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">BlockCred</p>
                    <h1 className="text-3xl font-semibold text-white mt-3 mb-2">Student Registration</h1>
                    <p className="text-sm text-indigo-100 mt-2">
                        Register to join the blockchain credential ecosystem
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your phone number"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Email ID *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="dob" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Date of Birth *
                            </label>
                            <input
                                type="date"
                                id="dob"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="school_name" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                School Name *
                            </label>
                            <input
                                type="text"
                                id="school_name"
                                name="school_name"
                                value={formData.school_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your school name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="photo" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Photo *
                            </label>
                            <input
                                type="file"
                                id="photo"
                                name="photo"
                                onChange={handleChange}
                                accept="image/*"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="father_name" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Father Name *
                            </label>
                            <input
                                type="text"
                                id="father_name"
                                name="father_name"
                                value={formData.father_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your father's name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="aadhar_number" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Aadhar Number *
                            </label>
                            <input
                                type="text"
                                id="aadhar_number"
                                name="aadhar_number"
                                value={formData.aadhar_number}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your Aadhar number"
                                pattern="[0-9]{12}"
                                maxLength={12}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="tenth_school" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                10th Grade School *
                            </label>
                            <input
                                type="text"
                                id="tenth_school"
                                name="tenth_school"
                                value={formData.tenth_school}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your 10th school name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="tenth_marks" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your 10th marks (0-100)"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="twelfth_school" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                12th Grade School *
                            </label>
                            <input
                                type="text"
                                id="twelfth_school"
                                name="twelfth_school"
                                value={formData.twelfth_school}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your 12th school name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="twelfth_marks" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter your 12th marks"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="twelfth_marksheet" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                12th Mark Sheet (PDF) *
                            </label>
                            <input
                                type="file"
                                id="twelfth_marksheet"
                                name="twelfth_marksheet"
                                onChange={handleChange}
                                accept=".pdf"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="cutoff" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Enter cut-off marks"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Password *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                                placeholder="Create a password"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-2xl">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-4 py-3 rounded-2xl">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-slate-900 py-3 px-4 rounded-2xl hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-indigo-200">
                        Already have an account?{" "}
                        <button
                            onClick={() => router.push("/login")}
                            className="text-white hover:text-indigo-200 font-semibold transition-colors underline"
                        >
                            Login here
                        </button>
                    </p>
                </div>

                <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <h3 className="font-semibold text-white mb-3">How it works:</h3>
                    <ol className="text-sm text-indigo-100 space-y-2 list-decimal list-inside">
                        <li>Fill out the registration form with your personal details and academic records</li>
                        <li>Select your 10th grade school and marks from the dropdown</li>
                        <li>Upload your photo and 12th mark sheet PDF</li>
                        <li>A unique Student ID will be generated based on your information</li>
                        <li>Admin will review and approve your registration</li>
                        <li>Once approved, a blockchain node will be assigned to you</li>
                        <li>Your credentials will be stored securely on the blockchain</li>
                    </ol>
                </div>
            </div>
        </main>
    );
}
