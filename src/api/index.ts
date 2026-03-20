const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
    statusCode?: number;
}

// Function to get the current session ID from localStorage
export const getSessionId = (): string | null => {
    return localStorage.getItem('session_id');
};

// Function to set the session ID in localStorage
export const setSessionId = (sessionId: string) => {
    localStorage.setItem('session_id', sessionId);
};

// Function to remove the session ID from localStorage
export const clearSession = () => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('robo_auth'); // Clear robo_auth as well if it's tied to session
};

// Generic API call function
async function callApi<T>(
    endpoint: string,
    method: string,
    body?: any,
    isMultipart: boolean = false
): Promise<ApiResponse<T>> {
    const sessionId = getSessionId();
    const headers: HeadersInit = {};

    if (sessionId) {
        headers['X-Session-ID'] = sessionId;
    }

    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        if (isMultipart) {
            config.body = body; // body is already FormData
        } else {
            config.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);


        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!response.ok) {
            let errorText: string;
            if (isJson) {
                const errorData = await response.json().catch(() => null);
                errorText = errorData?.detail || errorData?.message || response.statusText;
            } else {
                errorText = await response.text();
                if (errorText.startsWith('<!DOCTYPE html>')) {
                    const titleMatch = errorText.match(/<title>(.*?)<\/title>/);
                    errorText = titleMatch ? `Server Error: ${titleMatch[1]}` : `Server returned an HTML error page (Status: ${response.status})`;
                } else {
                    errorText = `Server error: ${errorText} (Status: ${response.status})`;
                }
            }
            return { error: errorText || 'An unknown error occurred', statusCode: response.status };
        }

        if (isJson) {
            const data: T = await response.json();
            return { data };
        } else {
            const rawText = await response.text();
            return { error: `Expected JSON but received non-JSON response: ${rawText.substring(0, Math.min(rawText.length, 200))}... (Status: ${response.status})`, statusCode: response.status };
        }
    } catch (error) {
        console.error("API call error:", error);
        return { error: (error instanceof Error ? error.message : String(error)) || 'Network error', statusCode: 0 };
    }
}

// --- API Endpoints ---

// POST /start-consultation
export const startConsultation = async (): Promise<ApiResponse<{ session_id: string }>> => {
    const response = await callApi<{ session_id: string }>('/start-consultation', 'POST');
    if (response.data?.session_id) {
        setSessionId(response.data.session_id);
        localStorage.setItem('robo_auth', 'true'); // Simulate login on session start
    }
    return response;
};

// POST /chat
export const chatWithBot = async (message: string): Promise<ApiResponse<{ bot_message: string; profile_updated: boolean; }>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    return callApi<{ bot_message: string; profile_updated: boolean; }>('/chat', 'POST', { session_id: sessionId, message_content: message });
};

// POST /upload-image
export const uploadImage = async (imageFile: File): Promise<ApiResponse<{ findings: string[] }>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("image_file", imageFile);
    return callApi<{ findings: string[] }>('/upload-image', 'POST', formData, true);
};

// POST /validate-detection
export const validateDetection = async (validatedFindings: string[]): Promise<ApiResponse<any>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    return callApi<any>('/validate-detection', 'POST', { session_id: sessionId, validated_findings: validatedFindings });
};

// GET /recommendations
export const getRecommendations = async (): Promise<ApiResponse<{ products: string[]; routine: string[] }>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    return callApi<{ products: string[]; routine: string[] }>(`/recommendations?session_id=${sessionId}`, 'GET');
};
