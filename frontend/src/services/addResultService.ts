const API_BASE_URL = "http://localhost:8080/api";

function getAuthHeaders(): HeadersInit {
	const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}

export interface CourseRow {
	CourseCode: string;
	CourseTitle: string;
	Semester: string;
	Credit: string;
}

export interface ResultDetailRow {
	RegisterNo: string;
	Name: string;
	CourseCode: string;
	Grade: string;
	ClearedBy: string;
}

export async function uploadCourses(courses: CourseRow[]): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/courses`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify({ courses }),
	});
	if (!res.ok) {
		const msg = (await res.json().catch(() => ({}))).message || res.statusText;
		throw new Error(`Courses: ${msg}`);
	}
}

export async function uploadResultDetails(rows: ResultDetailRow[]): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/result-details`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify({ rows }),
	});
	if (!res.ok) {
		const msg = (await res.json().catch(() => ({}))).message || res.statusText;
		throw new Error(`Result details: ${msg}`);
	}
}
