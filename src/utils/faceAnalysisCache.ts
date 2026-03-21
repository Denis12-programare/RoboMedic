export interface FaceAnalysisCacheEntry {
    findings: string[];
    capturedAt: string;
}

export interface RecommendationsCacheEntry<TPayload = Record<string, unknown>> {
    payload: TPayload;
    cachedAt: string;
}

export interface SessionCacheEntry {
    analysis?: FaceAnalysisCacheEntry;
    recommendations?: RecommendationsCacheEntry;
}

const SESSION_CACHE_KEY = 'robo_session_cache';

const safeParseCache = (): Record<string, SessionCacheEntry> => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return {};
        return parsed as Record<string, SessionCacheEntry>;
    } catch (error) {
        console.warn('Unable to parse session cache:', error);
        return {};
    }
};

const persistCache = (cache: Record<string, SessionCacheEntry>) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('Unable to persist session cache:', error);
    }
};

export const loadSessionCache = (): Record<string, SessionCacheEntry> => {
    return safeParseCache();
};

export const getSessionCacheEntry = (sessionId: string): SessionCacheEntry | undefined => {
    const cache = safeParseCache();
    return cache[sessionId];
};

export const saveFaceAnalysisForSession = (sessionId: string, findings: string[]): SessionCacheEntry => {
    const cache = safeParseCache();
    const entry = cache[sessionId] ?? {};
    entry.analysis = {
        findings,
        capturedAt: new Date().toISOString()
    };
    cache[sessionId] = entry;
    persistCache(cache);
    return entry;
};

export const saveRecommendationsForSession = (sessionId: string, payload: Record<string, unknown>): SessionCacheEntry => {
    const cache = safeParseCache();
    const entry = cache[sessionId] ?? {};
    entry.recommendations = {
        payload,
        cachedAt: new Date().toISOString()
    };
    cache[sessionId] = entry;
    persistCache(cache);
    return entry;
};

export const getFaceAnalysisForSession = (sessionId: string): FaceAnalysisCacheEntry | undefined => {
    return getSessionCacheEntry(sessionId)?.analysis;
};

export const clearFaceAnalysisForSession = (sessionId: string) => {
    const cache = safeParseCache();
    const entry = cache[sessionId];
    if (!entry) return;
    delete entry.analysis;
    if (!entry.recommendations) {
        delete cache[sessionId];
    } else {
        cache[sessionId] = entry;
    }
    persistCache(cache);
};

export const clearAllFaceAnalysisCache = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    window.localStorage.removeItem(SESSION_CACHE_KEY);
};
