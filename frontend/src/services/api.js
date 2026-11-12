
const API_BASE_URL = "https://cm-kerala-grievance-portal-nc9q.onrender.com/api";


// Common function for sending API requests
async function apiRequest(endpoint, options = {}, retry = true) {
    let token = localStorage.getItem("accessToken");

    const sendRequest = async (accessToken) => {
        const headers = {
            ...options.headers,
        };

        // Add JSON content type unless sending FormData
        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        // Add JWT token
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    };

    let response = await sendRequest(token);

    // If access token expired, try refreshing it
    if (response.status === 401 && retry) {
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
            try {
                const refreshResponse = await fetch(
                    `${API_BASE_URL}/auth/refresh/`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            refresh: refreshToken,
                        }),
                    }
                );

                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();

                    localStorage.setItem(
                        "accessToken",
                        refreshData.access
                    );

                    // Retry the original request with the new token
                    response = await sendRequest(refreshData.access);
                } else {
                    logoutUser();
                    throw new Error("Session expired. Please log in again.");
                }
            } catch (error) {
                logoutUser();
                throw error;
            }
        } else {
            logoutUser();
            throw new Error("Session expired. Please log in again.");
        }
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.error ||
            JSON.stringify(data)
        );
    }

    return data;
}

// Citizen registration
export function registerCitizen(userData) {
    return apiRequest("/auth/register/", {
        method: "POST",
        body: JSON.stringify(userData),
    });
}

// Login
export async function loginUser(credentials) {
    const data = await apiRequest("/auth/login/", {
        method: "POST",
        body: JSON.stringify(credentials),
    });

    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);

    return data;
}

// Logout
export function logoutUser() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
}

// Get departments
export function getDepartments() {
    return apiRequest("/departments/");
}

// Get all department officers (CMO only)
export function getOfficers() {
    return apiRequest("/auth/officers/");
}

// Submit grievance
export function submitGrievance(grievanceData) {
    return apiRequest("/grievances/", {
        method: "POST",
        body: grievanceData instanceof FormData
            ? grievanceData
            : JSON.stringify(grievanceData),
    });
}

// Get citizen grievances
export function getMyGrievances() {
    return apiRequest("/my-grievances/");
}

// Get all grievances for CMO
export function getAllGrievances() {
    return apiRequest("/cmo/grievances/");
}

// Get assigned grievances for officer
export function getOfficerGrievances() {
    return apiRequest("/officer/grievances/");
}
// Submit action-taken report by officer
export function updateOfficerGrievance(grievanceId, report) {
    return apiRequest(`/officer/grievances/${grievanceId}/update/`, {
        method: "POST",
        body: JSON.stringify({ report }),
    });
}
// Assign a grievance to a department officer (CMO only)
export function assignGrievance(assignmentData) {
    return apiRequest("/cmo/assign/", {
        method: "POST",
        body: JSON.stringify(assignmentData),
    });
}

// Get currently logged-in user details
export function getCurrentUser() {
    return apiRequest("/auth/me/");
}