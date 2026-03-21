const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
    statusCode?: number;
}

export interface UserProfilePayload {
    display_name?: string;
    profile_image?: string;
}

export interface SessionDetails {
    session_id: string;
    user_profile: UserProfilePayload;
}

// Updated ProfileUpdatePayload
export interface ProfileUpdatePayload {
    display_name?: string;
    profile_image_file?: File; // For uploading new profile image
}

export interface RegistrationPayload {
    name: string;
    email: string;
    password?: string;
    provider?: 'local' | 'google';
}

export interface RegistrationResponse {
    status: 'pending_verification' | 'ok';
    display_name?: string;
    email?: string;
}

export interface VerificationPayload {
    email: string;
    code: string;
}

export interface VerificationResponse {
    status: 'verified' | 'already_verified';
    display_name?: string;
    email?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    status: 'ok';
    display_name: string;
    email: string;
}

export interface UserProfileResponse {
    display_name?: string;
    profile_image?: string; // This will still exist in the response
    email: string;
    provider: string;
    email_verified: boolean;
}

export interface ImageAnalysisIssue {
    condition: string;
    confidence: number;
    description?: string;
}

export interface ImageAnalysisResponse {
    issues: ImageAnalysisIssue[];
    raw_response?: string;
}

export interface SessionHistoryEntry {
    role: string;
    content: string;
    message_type?: 'text' | 'analysis' | 'recommendation' | 'image_upload_prompt';
    data?: string;
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
};

// Generic API call function
async function callApi<T>(
    endpoint: string,
    method: string,
    body?: unknown,
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
            // Debugging: Log FormData contents
            console.log('Sending multipart request with FormData:');
            for (const pair of (body as FormData).entries()) {
                console.log(pair[0] + ', ' + pair[1]);
            }
            config.body = body as BodyInit; // body is already FormData
            // When sending FormData, browser automatically sets Content-Type including boundary
            // so we should NOT set it manually here.
            delete (config.headers as Record<string, string>)['Content-Type'];
        } else {
            config.body = JSON.stringify(body) as BodyInit;
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);


        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!response.ok) {
            let errorText: string;
            if (isJson) {
                const errorData = await response.json().catch(() => null) as Record<string, unknown> | null;
                if (errorData) {
                    if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && typeof errorData.detail[0] === 'object' && 'msg' in errorData.detail[0]) {
                        // Handle FastAPI-like validation errors
                        errorText = (errorData.detail as Array<Record<string, string>>).map(e => e.msg).join('; ');
                    } else if (typeof errorData.detail === 'string') {
                        errorText = errorData.detail;
                    } else if (typeof errorData.message === 'string') {
                        errorText = errorData.message;
                    } else {
                        errorText = response.statusText;
                    }
                } else {
                    errorText = response.statusText;
                }
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
export const startConsultation = async (userEmail: string): Promise<ApiResponse<{ session_id: string }>> => {
    const response = await callApi<{ session_id: string }>(`/start-consultation?user_email=${encodeURIComponent(userEmail)}`, 'POST');
    if (response.data?.session_id) {
        setSessionId(response.data.session_id);
        localStorage.setItem('robo_auth', 'true'); // Simulate login on session start
    }
    return response;
};

// POST /chat
export const chatWithBot = async (message: string, userEmail: string): Promise<ApiResponse<{ response: string; session_id: string; profile_status: Record<string, boolean>; health_metrics?: Record<string, number>; }>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    return callApi<{ response: string; session_id: string; profile_status: Record<string, boolean>; health_metrics?: Record<string, number>; }>('/chat', 'POST', { session_id: sessionId, message, user_email: userEmail });
};

// POST /upload-image
export const uploadImage = async (imageFile: File, _userEmail: string): Promise<ApiResponse<ImageAnalysisResponse>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    const formData = new FormData();
    // The backend expects session_id in the query string and the uploaded file
    // in the multipart body under the "file" field.
    formData.append("file", imageFile, imageFile.name);
    return callApi<ImageAnalysisResponse>(
        `/upload-image?session_id=${encodeURIComponent(sessionId)}`,
        'POST',
        formData,
        true
    );
};

// POST /validate-detection
export const validateDetection = async (validatedFindings: string[]): Promise<ApiResponse<Record<string, unknown>>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    return callApi<Record<string, unknown>>('/validate-detection', 'POST', { session_id: sessionId, validated_findings: validatedFindings });
};

// GET /recommendations
export const getRecommendations = async (userEmail: string): Promise<ApiResponse<{ morning_routine: string[]; night_routine: string[]; products: Array<Record<string, string>>; lifestyle_tips: string[]; diet_tips: string[] }>> => {
    const sessionId = getSessionId();
    if (!sessionId) {
        return { error: "No active session. Please start a consultation first.", statusCode: 401 };
    }
    if (!userEmail) {
        return { error: "User email is required", statusCode: 400 };
    }
    return callApi<{ morning_routine: string[]; night_routine: string[]; products: Array<Record<string, string>>; lifestyle_tips: string[]; diet_tips: string[] }>(`/recommendations?session_id=${sessionId}&user_email=${encodeURIComponent(userEmail)}`, 'GET');
};

// GET /sessions
export const listSessions = async (userEmail: string): Promise<ApiResponse<Array<{ session_id: string; session_name?: string; created_at: string; updated_at: string; last_message?: string }>>> => {
    return callApi<Array<{ session_id: string; session_name?: string; created_at: string; updated_at: string; last_message?: string }>>(`/sessions?user_email=${encodeURIComponent(userEmail)}`, 'GET');
};

// GET /sessions/:session_id/history
export const getSessionHistory = async (sessionId: string, userEmail: string): Promise<ApiResponse<{ session_id: string; history: SessionHistoryEntry[] }>> => {
    return callApi<{ session_id: string; history: SessionHistoryEntry[] }>(`/sessions/${sessionId}/history?user_email=${encodeURIComponent(userEmail)}`, 'GET');
};

export const getSessionDetails = async (sessionId: string, userEmail: string): Promise<ApiResponse<SessionDetails>> => {
    return callApi<SessionDetails>(`/sessions/${sessionId}?user_email=${encodeURIComponent(userEmail)}`, 'GET');
};

export const updateUserProfile = async (
    userEmail: string,
    payload: ProfileUpdatePayload
): Promise<ApiResponse<{ user_profile: UserProfileResponse }>> => {
    const formData = new FormData();
    if (payload.display_name) {
        formData.append('display_name', payload.display_name);
    }
    if (payload.profile_image_file) {
        formData.append('profile_image_file', payload.profile_image_file);
    }

    const sessionId = getSessionId(); // Assuming sessionId might be needed for context on the backend
    let endpoint = `/users/profile?email=${encodeURIComponent(userEmail)}`;
    
    // If a session ID exists, include it in the endpoint or as a header, depending on API design
    // For now, let's assume it's sent as a query parameter if needed, or handled by the backend from X-Session-ID header
    if (sessionId) {
        endpoint += `&session_id=${encodeURIComponent(sessionId)}`;
    }

    // Determine if it's a multipart request
    const isMultipart = !!payload.profile_image_file;

    return callApi<{ user_profile: UserProfileResponse }>(
        endpoint,
        'PUT',
        isMultipart ? formData : { display_name: payload.display_name },
        isMultipart
    );
};


export const registerUser = async (payload: RegistrationPayload): Promise<ApiResponse<RegistrationResponse>> => {
    return callApi<RegistrationResponse>('/users/register', 'POST', payload);
};

export const verifyEmailCode = async (payload: VerificationPayload): Promise<ApiResponse<VerificationResponse>> => {
    return callApi<VerificationResponse>('/users/verify-email', 'POST', payload);
};

export const loginUser = async (payload: LoginPayload): Promise<ApiResponse<LoginResponse>> => {
    return callApi<LoginResponse>('/users/login', 'POST', payload);
};

export const googleLogin = async (credential: string): Promise<ApiResponse<LoginResponse>> => {
    return callApi<LoginResponse>('/users/oauth/google', 'POST', { credential });
};

export const getUserProfile = async (email: string): Promise<ApiResponse<{ user_profile: UserProfileResponse }>> => {
    return callApi<{ user_profile: UserProfileResponse }>(`/users/profile?email=${encodeURIComponent(email)}`, 'GET');
};

// POST /sessions/:session_id/rewind
export const rewindSession = async (sessionId: string, index: number, userEmail: string): Promise<ApiResponse<{ session_id: string; history: SessionHistoryEntry[] }>> => {
    return callApi<{ session_id: string; history: SessionHistoryEntry[] }>(`/sessions/${sessionId}/rewind?user_email=${encodeURIComponent(userEmail)}`, 'POST', { index });
};

// POST /sessions/:session_id/rename
export const renameSession = async (sessionId: string, session_name: string, userEmail: string): Promise<ApiResponse<{ session_id: string; session_name: string }>> => {
    return callApi<{ session_id: string; session_name: string }>(`/sessions/${sessionId}/rename?user_email=${encodeURIComponent(userEmail)}`, 'POST', { session_name });
};

// DELETE /sessions/:session_id
export const deleteSession = async (sessionId: string, userEmail: string): Promise<ApiResponse<{ status: string; session_id: string }>> => {
    return callApi<{ status: string; session_id: string }>(`/sessions/${sessionId}?user_email=${encodeURIComponent(userEmail)}`, 'DELETE');
};
