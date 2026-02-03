"use client";

import { Loader2 } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
	uploadCourses,
	uploadResultDetails,
	type CourseRow,
	type ResultDetailRow,
} from "@/services/addResultService";
import type { DropzoneOptions } from "react-dropzone";

function excelDateToJSDate(serial: number): Date {
	const utcDays = Math.floor(serial - 25569);
	const utcValue = utcDays * 86400;
	const dateInfo = new Date(utcValue * 1000);
	const fractionalDay = serial - Math.floor(serial) + 0.0000001;
	let totalSeconds = Math.floor(86400 * fractionalDay);
	const seconds = totalSeconds % 60;
	totalSeconds -= seconds;
	const hours = Math.floor(totalSeconds / (60 * 60));
	const minutes = Math.floor(totalSeconds / 60) % 60;
	return new Date(
		dateInfo.getFullYear(),
		dateInfo.getMonth(),
		dateInfo.getDate(),
		hours,
		minutes,
		seconds,
	);
}

function formatDateToMonthYear(date: Date): string {
	return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export default function AddResultPage() {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [parsedCourses, setParsedCourses] = useState<CourseRow[]>([]);
	const [parsedResults, setParsedResults] = useState<ResultDetailRow[]>([]);
	const [showPreview, setShowPreview] = useState(false);

	const parseCoursesFromSheet = useCallback((data: unknown[][]): CourseRow[] => {
		const rows: CourseRow[] = [];
		for (let i = 1; i < data.length; i++) {
			const row = data[i] as (string | number)[];
			const [courseCode, courseTitle, semester, credit] = row;
			if (!courseCode) continue;
			rows.push({
				CourseCode: String(courseCode),
				CourseTitle: courseTitle != null ? String(courseTitle) : "",
				Semester: semester != null ? String(semester) : "",
				Credit: credit != null ? String(credit) : "",
			});
		}
		return rows;
	}, []);

	const parseResultsFromSheet = useCallback((data: unknown[][]): ResultDetailRow[] => {
		const columnNames = (data[0] || []) as string[];
		const registerNoIndex = columnNames.indexOf("Register No.");
		const nameIndex = columnNames.indexOf("Name");
		const clearedByIndex = columnNames.indexOf("ClearedBy");
		const rows: ResultDetailRow[] = [];

		for (let i = 1; i < data.length; i++) {
			const row = (data[i] || []) as (string | number)[];
			const registerNo = row[registerNoIndex];
			const name = row[nameIndex];
			const clearedBySerial = row[clearedByIndex];

			if (!registerNo || !name) continue;

			let clearedBy = "None";
			if (clearedBySerial != null && !Number.isNaN(Number(clearedBySerial))) {
				const clearedByDate = excelDateToJSDate(Number(clearedBySerial));
				clearedBy = formatDateToMonthYear(clearedByDate);
			}

			for (let j = 0; j < columnNames.length; j++) {
				if (
					j !== registerNoIndex &&
					j !== nameIndex &&
					j !== clearedByIndex
				) {
					const courseCode = columnNames[j];
					const grade = row[j];
					if (!courseCode) continue;
					rows.push({
						RegisterNo: String(registerNo ?? "None"),
						Name: String(name ?? "None"),
						CourseCode: String(courseCode ?? "None"),
						Grade: grade != null && grade !== "" ? String(grade) : "-",
						ClearedBy: clearedBy ?? "None",
					});
				}
			}
		}
		return rows;
	}, []);

	const handleUploadFileToDB = useCallback<NonNullable<DropzoneOptions["onDrop"]>>(
		async (acceptedFiles) => {
			if (!acceptedFiles?.length) return;
			setError(null);
			setIsLoading(true);
			setIsSubmitted(false);

			try {
				const file = acceptedFiles[0];
				const buffer = await file.arrayBuffer();
				const wb = XLSX.read(buffer, { type: "array" });

				let courses: CourseRow[] = [];
				let resultRows: ResultDetailRow[] = [];

				for (let index = 0; index < wb.SheetNames.length; index++) {
					const sheetName = wb.SheetNames[index];
					const data = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
						header: 1,
					}) as unknown[][];
					if (index === 0) {
						resultRows = parseResultsFromSheet(data);
					} else if (index === 1) {
						courses = parseCoursesFromSheet(data);
					}
				}

				// Console logs for debugging
				console.log("📊 Parsed Courses:", courses);
				console.log("📊 Total Courses:", courses.length);
				console.log("📋 Parsed Result Details:", resultRows);
				console.log("📋 Total Result Rows:", resultRows.length);
				console.log("📄 Sheet Names:", wb.SheetNames);

				// Store parsed data and show preview
				setParsedCourses(courses);
				setParsedResults(resultRows);
				setShowPreview(true);
				setIsLoading(false);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Upload failed";
				setError(message);
				setIsLoading(false);
			}
		},
		[parseCoursesFromSheet, parseResultsFromSheet],
	);

	const handleUploadToServer = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			if (parsedResults.length > 0) {
				await uploadResultDetails(parsedResults);
			}
			if (parsedCourses.length > 0) {
				await uploadCourses(parsedCourses);
			}
			setIsSubmitted(true);
			setShowPreview(false);
			setParsedCourses([]);
			setParsedResults([]);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Upload failed";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}, [parsedCourses, parsedResults]);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop: handleUploadFileToDB,
		disabled: isLoading,
		accept: {
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
			"application/vnd.ms-excel": [".xls"],
		},
		maxFiles: 1,
	});

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
					<p className="text-lg text-gray-600 dark:text-gray-400">
						Uploading. Please wait...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900">
			<header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
				<a
					href="/"
					className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
				>
					← Back to BlockCred
				</a>
			</header>
			<div className="flex flex-grow flex-col items-center gap-6 overflow-auto p-4">
				{!showPreview ? (
					<div
						{...getRootProps()}
						className="max-w-md w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-400 bg-white p-8 shadow-lg transition hover:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400"
					>
						<input {...getInputProps()} id="file" type="file" className="hidden" />
						<label htmlFor="file" className="block cursor-pointer text-center">
							<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
								<svg
									viewBox="0 0 24 24"
									fill="currentColor"
									className="h-10 w-10 text-blue-500 dark:text-blue-400"
									aria-hidden
								>
									<path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
								</svg>
							</div>
							<h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">
								Upload Your Courses and Results Here
							</h1>
							<p className="mb-2 text-gray-600 dark:text-gray-400">
								Drag and drop your file here
							</p>
							<p className="mb-2 text-gray-600 dark:text-gray-400">or</p>
							<span className="inline-block rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
								Browse file
							</span>
						</label>
						{isSubmitted && (
							<p className="mt-4 text-center font-semibold text-green-600 dark:text-green-400">
								File submitted successfully!
							</p>
						)}
						{error && (
							<p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
								{error}
							</p>
						)}
					</div>
				) : (
					<div className="w-full max-w-7xl space-y-6">
						<div className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
							<div>
								<h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
									Data Preview
								</h2>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{parsedCourses.length} courses • {parsedResults.length} result rows
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => {
										setShowPreview(false);
										setParsedCourses([]);
										setParsedResults([]);
									}}
									className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								>
									Cancel
								</button>
								<button
									onClick={handleUploadToServer}
									disabled={isLoading}
									className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
								>
									{isLoading ? "Uploading..." : "Upload to Server"}
								</button>
							</div>
						</div>

						{parsedCourses.length > 0 && (
							<div className="rounded-lg bg-white shadow dark:bg-gray-800">
								<div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
									<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
										Courses ({parsedCourses.length})
									</h3>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-gray-50 dark:bg-gray-700">
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Course Code
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Course Title
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Semester
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Credit
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
											{parsedCourses.map((course, idx) => (
												<tr
													key={idx}
													className="hover:bg-gray-50 dark:hover:bg-gray-700"
												>
													<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{course.CourseCode}
													</td>
													<td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{course.CourseTitle}
													</td>
													<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{course.Semester}
													</td>
													<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{course.Credit}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{parsedResults.length > 0 && (
							<div className="rounded-lg bg-white shadow dark:bg-gray-800">
								<div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
									<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
										Result Details ({parsedResults.length})
									</h3>
								</div>
								<div className="overflow-x-auto max-h-[600px]">
									<table className="w-full">
										<thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Register No.
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Name
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Course Code
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Grade
												</th>
												<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
													Cleared By
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
											{parsedResults.map((row, idx) => (
												<tr
													key={idx}
													className="hover:bg-gray-50 dark:hover:bg-gray-700"
												>
													<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{row.RegisterNo}
													</td>
													<td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{row.Name}
													</td>
													<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{row.CourseCode}
													</td>
													<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{row.Grade}
													</td>
													<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
														{row.ClearedBy}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
