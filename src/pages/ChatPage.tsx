import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Plus,
  ScanFace,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  chatWithBot,
  clearSession,
  deleteSession,
  getRecommendations,
  getSessionDetails,
  getSessionHistory,
  getSessionId,
  getUserProfile,
  listSessions,
  renameSession,
  rewindSession,
  setSessionId,
  startConsultation,
  updateUserProfile,
  uploadImage,
} from '../api';
import type { ProfileUpdatePayload, SessionHistoryEntry } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { loadSessionCache, saveFaceAnalysisForSession, saveRecommendationsForSession } from '../utils/faceAnalysisCache';
import type { SessionCacheEntry } from '../utils/faceAnalysisCache';
import { getThemePreference, setThemePreference } from '../utils/themePreference';
import type { ThemeMode } from '../utils/themePreference';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'analysis' | 'recommendation' | 'image_upload_prompt';
  data?: unknown;
}

interface Recommendations {
  products: Array<Record<string, unknown>>;
  morning_routine?: unknown[];
  night_routine?: unknown[];
  lifestyle_tips?: unknown[];
  diet_tips?: unknown[];
}

interface SessionItem {
  session_id: string;
  session_name?: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

const isRecommendations = (value: unknown): value is Recommendations =>
  Boolean(value && typeof value === 'object' && Array.isArray((value as Recommendations).products));

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const buildInitialBotMessage = useCallback(
    (): Message => ({
      id: 'initial',
      text: "Hello! I'm RoboMedic, your intelligent aesthetic assistant. How can I help you today? You can ask me about skincare routines, facial analysis, or specific skin concerns.",
      sender: 'bot',
      timestamp: new Date(),
    }),
    [],
  );

  const [messages, setMessages] = useState<Message[]>([buildInitialBotMessage()]);
  const [savedSessions, setSavedSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [sessionCache, setSessionCache] = useState<Record<string, SessionCacheEntry>>({});
  const [recommendationsFetchingForSession, setRecommendationsFetchingForSession] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isSearchPanelOpen, setSearchPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isLeftMenuOpen, setLeftMenuOpen] = useState(false);
  const [isRightMenuOpen, setRightMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoStartNewSession, setAutoStartNewSession] = useState(true);
  const [insightNotificationsEnabled, setInsightNotificationsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getThemePreference(localStorage.getItem('robo_user_email')));
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [skinScore, setSkinScore] = useState<number | null>(null);
  const [hydration, setHydration] = useState<number | null>(null);
  const [porosity, setPorosity] = useState<number | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const messageStreamRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasLoadedSessionsRef = useRef(false);

  const displayName = userName || 'Guest User';

  useEffect(() => {
    const stream = messageStreamRef.current;
    if (!stream) return;
    stream.scrollTo({
      top: stream.scrollHeight,
      behavior: messages.length > 1 || isTyping ? 'smooth' : 'auto',
    });
  }, [messages, isTyping]);

  useEffect(() => {
    setSessionCache(loadSessionCache());
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem('robo_user_name');
    const storedEmail = localStorage.getItem('robo_user_email');
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    setThemeMode(getThemePreference(userEmail));
    const fetchProfile = async () => {
      const response = await getUserProfile(userEmail);
      if (response.data?.user_profile) {
        const profile = response.data.user_profile;
        if (profile.display_name) {
          setUserName(profile.display_name);
          localStorage.setItem('robo_user_name', profile.display_name);
        }
        if (profile.profile_image) {
          setProfilePictureUrl(profile.profile_image);
        }
      }
    };
    void fetchProfile();
  }, [userEmail]);

  useEffect(() => {
    if (isSearchPanelOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchPanelOpen]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const closeOverlays = useCallback(() => {
    setLeftMenuOpen(false);
    setRightMenuOpen(false);
    setSearchPanelOpen(false);
    setSettingsPanelOpen(false);
    setProfileDropdownOpen(false);
    setShowImageOptions(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCameraModal) {
          setShowCameraModal(false);
        }
        closeOverlays();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeOverlays, showCameraModal]);

  useEffect(() => {
    if (!selectedSessionId) {
      setRecommendations(null);
      return;
    }
    const entry = sessionCache[selectedSessionId];
    if (isRecommendations(entry?.recommendations?.payload)) {
      setRecommendations(entry.recommendations.payload);
    } else {
      setRecommendations(null);
    }
  }, [selectedSessionId, sessionCache]);

  const getErrorMessage = useCallback((err: unknown): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const typed = err as Record<string, unknown>;
      if (typeof typed.message === 'string') return typed.message;
      if (typeof typed.detail === 'string') return typed.detail;
    }
    return 'Something went wrong.';
  }, []);

  const toReadableText = useCallback((data: unknown): string => {
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object' && 'text' in data && typeof data.text === 'string') return data.text;
    if (data && typeof data === 'object' && 'name' in data && typeof data.name === 'string') return data.name;
    return String(data ?? '');
  }, []);

  const mapHistoryEntryToMessage = useCallback((entry: SessionHistoryEntry, index: number): Message => {
    let parsedData: unknown = entry.data;
    if (entry.message_type === 'analysis' && typeof entry.data === 'string') {
      try {
        parsedData = JSON.parse(entry.data);
      } catch {
        parsedData = entry.data;
      }
    }
    return {
      id: `${entry.role}-${index}-${entry.content.slice(0, 12)}`,
      sender: entry.role === 'user' ? 'user' : 'bot',
      text: entry.content,
      timestamp: new Date(),
      type: entry.message_type,
      data: parsedData,
    };
  }, []);

  const ensureSession = useCallback(async () => {
    if (selectedSessionId) return selectedSessionId;
    if (!userEmail) {
      setError('User email missing. Please log in again.');
      return null;
    }
    const createResp = await startConsultation(userEmail);
    if (createResp.error || !createResp.data?.session_id) {
      setError(getErrorMessage(createResp.error || 'Could not create session.'));
      return null;
    }
    const newSessionId = createResp.data.session_id;
    setSelectedSessionId(newSessionId);
    const timestamp = new Date().toISOString();
    setSavedSessions((prev) => [{ session_id: newSessionId, created_at: timestamp, updated_at: timestamp }, ...prev]);
    return newSessionId;
  }, [getErrorMessage, selectedSessionId, userEmail]);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!userEmail) {
      setError('User email missing. Please log in again.');
      return;
    }
    setError(null);
    const response = await getSessionHistory(sessionId, userEmail);
    if (!response.data) {
      setError(getErrorMessage(response.error));
      return;
    }
    const loadedMessages = response.data.history.map(mapHistoryEntryToMessage);
    setMessages(loadedMessages.length > 0 ? loadedMessages : [buildInitialBotMessage()]);
    setSelectedSessionId(sessionId);
    setSessionId(sessionId);
    closeOverlays();

    const sessionDetails = await getSessionDetails(sessionId, userEmail);
    if (sessionDetails.data?.user_profile) {
      const profile = sessionDetails.data.user_profile;
      if (profile.display_name) {
        setUserName(profile.display_name);
        localStorage.setItem('robo_user_name', profile.display_name);
      }
      if (profile.profile_image) {
        setProfilePictureUrl(profile.profile_image);
      }
    }
  }, [buildInitialBotMessage, closeOverlays, getErrorMessage, mapHistoryEntryToMessage, userEmail]);

  const loadSavedSessions = useCallback(async () => {
    if (!userEmail) return;
    const response = await listSessions(userEmail);
    if (!response.data) return;
    setSavedSessions(response.data);
    if (response.data.length === 0) {
      clearSession();
      setSelectedSessionId(null);
      setMessages([buildInitialBotMessage()]);
      return;
    }
    const storedSessionId = getSessionId();
    const hasStored = storedSessionId && response.data.some((item) => item.session_id === storedSessionId);
    const targetSessionId = hasStored ? storedSessionId! : response.data[0].session_id;
    await loadSession(targetSessionId);
  }, [buildInitialBotMessage, loadSession, userEmail]);

  useEffect(() => {
    if (!userEmail || hasLoadedSessionsRef.current) return;
    hasLoadedSessionsRef.current = true;
    void loadSavedSessions();
  }, [loadSavedSessions, userEmail]);

  const currentCache = selectedSessionId ? sessionCache[selectedSessionId] : undefined;

  const fetchRecommendations = useCallback(async () => {
    if (!selectedSessionId || !userEmail) {
      setError('Cannot fetch recommendations without an active session.');
      return;
    }
    if (recommendationsFetchingForSession === selectedSessionId) return;
    setRecommendationsFetchingForSession(selectedSessionId);
    setError(null);
    const response = await getRecommendations(userEmail);
    if (response.data) {
      setRecommendations(response.data);
      const entry = saveRecommendationsForSession(selectedSessionId, response.data);
      setSessionCache((prev) => ({ ...prev, [selectedSessionId]: entry }));
    } else {
      setError(getErrorMessage(response.error || 'Failed to fetch recommendations.'));
    }
    setRecommendationsFetchingForSession(null);
  }, [getErrorMessage, recommendationsFetchingForSession, selectedSessionId, userEmail]);

  const fileToDataUrl = useCallback((file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read image preview.'));
    reader.readAsDataURL(file);
  }), []);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file || !userEmail) return;
    const sessionId = await ensureSession();
    if (!sessionId) return;

    setError(null);
    setUploadingImage(true);
    setShowImageOptions(false);
    let previewUrl: string | null = null;
    try {
      previewUrl = await fileToDataUrl(file);
    } catch {
      previewUrl = null;
    }

    setMessages((prev) => [
      ...prev,
      { id: `upload-${Date.now()}`, text: file.name, sender: 'user', timestamp: new Date(), type: 'image_upload_prompt', data: previewUrl },
    ]);

    const response = await uploadImage(file, userEmail);
    if (response.data) {
      const analysis = response.data;
      const findings = analysis.issues.map((issue) => issue.condition);
      const entry = saveFaceAnalysisForSession(sessionId, findings);
      setSessionCache((prev) => ({ ...prev, [sessionId]: entry }));
      setMessages((prev) => [
        ...prev,
        {
          id: `analysis-${Date.now()}`,
          text: findings.length > 0
            ? `I've detected the following: ${findings.join(', ')}. Do these look correct?`
            : "I couldn't detect any specific issues. Is there anything particular you'd like me to analyze?",
          sender: 'bot',
          timestamp: new Date(),
          type: 'analysis',
          data: analysis.issues,
        },
      ]);
    } else {
      const message = getErrorMessage(response.error);
      setError(message);
      setMessages((prev) => [...prev, { id: `analysis-error-${Date.now()}`, text: `Image analysis failed: ${message}`, sender: 'bot', timestamp: new Date() }]);
    }
    setUploadingImage(false);
  }, [ensureSession, fileToDataUrl, getErrorMessage, userEmail]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim() || !userEmail) return;
    setError(null);
    const sessionId = await ensureSession();
    if (!sessionId) return;

    const userMessage: Message = { id: `message-${Date.now()}`, text: inputValue.trim(), sender: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const response = await chatWithBot(userMessage.text, userEmail);
    if (response.data) {
      const data = response.data;
      setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, text: data.response || 'Sorry, I could not process your message right now.', sender: 'bot', timestamp: new Date() }]);
      if (data.health_metrics) {
        setSkinScore(data.health_metrics.skin_score ?? null);
        setHydration(data.health_metrics.hydration ?? null);
        setPorosity(data.health_metrics.porosity ?? null);
      }
      if (data.profile_status && Object.values(data.profile_status).some(Boolean)) {
        void fetchRecommendations();
      }
    } else {
      const message = getErrorMessage(response.error);
      setError(message);
      setMessages((prev) => [...prev, { id: `bot-error-${Date.now()}`, text: message, sender: 'bot', timestamp: new Date() }]);
    }
    setIsTyping(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await handleImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setShowCameraModal(false);
  }, [cameraStream]);

  const handleTakePhoto = async () => {
    setShowImageOptions(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCameraModal(true);
    } catch {
      setError('Could not access camera. Please ensure permissions are granted.');
    }
  };

  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      void videoRef.current.play();
    }
    return () => {
      if (!showCameraModal && cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream, showCameraModal]);

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture photo.');
        return;
      }
      const file = new File([blob], `photo-${Date.now()}.png`, { type: 'image/png' });
      stopCamera();
      await handleImageFile(file);
    }, 'image/png');
  };

  const handleNewAnalysis = useCallback(async () => {
    setMessages([buildInitialBotMessage()]);
    setSelectedSessionId(null);
    setRecommendations(null);
    setSkinScore(null);
    setHydration(null);
    setPorosity(null);
    clearSession();
    if (autoStartNewSession && userEmail) {
      setError(null);
      const createResp = await startConsultation(userEmail);
      if (createResp.error || !createResp.data?.session_id) {
        setError(getErrorMessage(createResp.error || 'Could not create new session.'));
        return;
      }
      const newSessionId = createResp.data.session_id;
      setSelectedSessionId(newSessionId);
      const timestamp = new Date().toISOString();
      setSavedSessions((prev) => [{ session_id: newSessionId, created_at: timestamp, updated_at: timestamp }, ...prev]);
    }
    closeOverlays();
  }, [autoStartNewSession, buildInitialBotMessage, closeOverlays, getErrorMessage, userEmail]);

  const handleRenameSession = async (sessionId: string, currentName?: string) => {
    const name = window.prompt('Enter a new name for this session', currentName ?? '');
    if (!name?.trim() || !userEmail) return;
    const response = await renameSession(sessionId, name.trim(), userEmail);
    if (response.error) {
      setError(getErrorMessage(response.error));
      return;
    }
    setSavedSessions((prev) => prev.map((session) => (
      session.session_id === sessionId
        ? { ...session, session_name: name.trim(), updated_at: new Date().toISOString() }
        : session
    )));
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this session? This action cannot be undone.') || !userEmail) return;
    const response = await deleteSession(sessionId, userEmail);
    if (response.error) {
      setError(getErrorMessage(response.error));
      return;
    }
    setSessionCache((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
    setSavedSessions((prev) => prev.filter((session) => session.session_id !== sessionId));
    if (getSessionId() === sessionId) {
      clearSession();
      setSelectedSessionId(null);
      setMessages([buildInitialBotMessage()]);
      setRecommendations(null);
      setSkinScore(null);
      setHydration(null);
      setPorosity(null);
    }
  };

  const rewindToIndex = async (index: number) => {
    if (!selectedSessionId || !userEmail) {
      setError('No active session selected to rewind.');
      return;
    }
    const response = await rewindSession(selectedSessionId, index, userEmail);
    if (!response.data) {
      setError(getErrorMessage(response.error));
      return;
    }
    setMessages(response.data.history.map(mapHistoryEntryToMessage));
    setError(null);
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userEmail) return;
    const payload: ProfileUpdatePayload = { display_name: userName, profile_image_file: file };
    const response = await updateUserProfile(userEmail, payload);
    if (response.data?.user_profile?.profile_image) {
      setProfilePictureUrl(response.data.user_profile.profile_image);
    } else if (response.error) {
      setError(getErrorMessage(response.error));
    }
    if (profileInputRef.current) profileInputRef.current.value = '';
  };

  const handleLogout = useCallback(() => {
    clearSession();
    localStorage.removeItem('robo_auth');
    localStorage.removeItem('robo_user_name');
    localStorage.removeItem('robo_user_email');
    localStorage.removeItem('robo_profile_image');
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate, setIsAuthenticated]);

  const handleThemeModeChange = useCallback((nextMode: ThemeMode) => {
    setThemeMode(nextMode);
    setThemePreference(nextMode, userEmail || localStorage.getItem('robo_user_email'));
  }, [userEmail]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredSessions = useMemo(() => {
    if (!normalizedSearchQuery) return savedSessions;
    return savedSessions.filter((session) => {
      const searchable = `${session.session_id} ${session.session_name ?? ''} ${session.last_message ?? ''}`.toLowerCase();
      return searchable.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, savedSessions]);

  const analysisFindings = currentCache?.analysis?.findings ?? [];
  const routineSteps = [...(recommendations?.morning_routine ?? []), ...(recommendations?.night_routine ?? [])];
  const insightCards = [
    { label: 'Skin score', value: skinScore !== null ? `${skinScore}` : 'Waiting', note: 'Overall signal' },
    { label: 'Hydration', value: hydration !== null ? `${hydration}%` : 'Waiting', note: 'Moisture balance' },
    { label: 'Porosity', value: porosity !== null ? `${porosity}%` : 'Waiting', note: 'Surface texture' },
  ];
  const hasBlockingMenuOpen =
    isLeftMenuOpen ||
    isRightMenuOpen ||
    showImageOptions;

  return (
    <div className="chat-shell" onClick={closeOverlays}>
      <AnimatePresence>
        {hasBlockingMenuOpen && (
          <motion.button
            type="button"
            className="chat-menu-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeOverlays}
            aria-label="Close menus"
          />
        )}
      </AnimatePresence>

      <main className="chat-pane chat-main" onClick={(event) => event.stopPropagation()}>
        {error && <div className="status-banner"><AlertCircle size={18} /><span>{error}</span></div>}
        <header className="chat-toolbar">
          <div className="chat-toolbar__controls">
            <div className="chat-toolbar__group chat-toolbar__group--left">
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setLeftMenuOpen((prev) => !prev);
                  setRightMenuOpen(false);
                  setSearchPanelOpen(false);
                  setSettingsPanelOpen(false);
                  setProfileDropdownOpen(false);
                }}
                aria-label="Open left menu"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="chat-toolbar__group chat-toolbar__group--center">
              <button type="button" className="icon-button" onClick={() => { setSearchPanelOpen((prev) => !prev); setSettingsPanelOpen(false); setProfileDropdownOpen(false); }}><Search size={18} /></button>
              <button type="button" className="icon-button" onClick={() => { setSettingsPanelOpen((prev) => !prev); setSearchPanelOpen(false); setProfileDropdownOpen(false); }}><Settings size={18} /></button>
              <button type="button" className="icon-button" onClick={() => { setProfileDropdownOpen((prev) => !prev); setSearchPanelOpen(false); setSettingsPanelOpen(false); }} style={{ overflow: 'hidden' }}>
                {profilePictureUrl ? <img src={profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} />}
              </button>
            </div>
            <div className="chat-toolbar__group chat-toolbar__group--right">
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setRightMenuOpen((prev) => !prev);
                  setLeftMenuOpen(false);
                  setSearchPanelOpen(false);
                  setSettingsPanelOpen(false);
                  setProfileDropdownOpen(false);
                }}
                aria-label="Open right menu"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
          <div className="chat-toolbar__meta">
            <div className="chat-toolbar__title-row">
              <h2 style={{ fontSize: '1.3rem' }}>Active Analysis Session</h2>
              <span className="metric-pill" style={{ padding: '0.35rem 0.75rem' }}><Activity size={12} color="var(--accent-green)" />Live</span>
            </div>
            <p className="chat-toolbar__session-note" style={{ fontSize: '0.92rem' }}>{selectedSessionId ? `Session ${selectedSessionId.slice(0, 8)} is active` : 'Start a message or upload an image to begin'}</p>
          </div>
        </header>

        <AnimatePresence>
          {isSearchPanelOpen && (
            <motion.div className="floating-panel" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onClick={(event) => event.stopPropagation()}>
              <div className="floating-panel__content">
                <div className="floating-panel__section"><div className="floating-panel__title">Search sessions</div><p className="floating-panel__body">Jump to any previous consultation.</p></div>
                <input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name, message, or ID" />
                <div className="floating-panel__list">
                  {filteredSessions.length === 0 ? <p style={{ fontSize: '0.88rem' }}>No sessions match that search.</p> : filteredSessions.map((session) => (
                    <button key={`search-${session.session_id}`} type="button" className="floating-panel__action" onClick={() => void loadSession(session.session_id)}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{session.session_name || `Session ${session.session_id.slice(0, 8)}`}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Updated {new Date(session.updated_at).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSettingsPanelOpen && (
            <motion.div className="floating-panel" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onClick={(event) => event.stopPropagation()}>
              <div className="floating-panel__content" style={{ gap: 14 }}>
                <div className="floating-panel__section"><div className="floating-panel__title">Workspace settings</div><p className="floating-panel__body">Adjust how the consultation shell behaves.</p></div>
                <GlassCard style={{ padding: 14 }}>
                  <div className="settings-row settings-row--wrap">
                    <div className="settings-row__content"><div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Appearance</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose light, dark, or follow your device.</div></div>
                    <div className="chip-toggle chip-toggle--compact">
                      <button type="button" className={themeMode === 'light' ? 'is-active' : ''} onClick={() => handleThemeModeChange('light')}>Light</button>
                      <button type="button" className={themeMode === 'dark' ? 'is-active' : ''} onClick={() => handleThemeModeChange('dark')}>Dark</button>
                      <button type="button" className={themeMode === 'system' ? 'is-active' : ''} onClick={() => handleThemeModeChange('system')}>System</button>
                    </div>
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: 14 }}>
                  <div className="settings-row">
                    <div className="settings-row__content"><div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Auto-start sessions</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create a session automatically when needed.</div></div>
                    <div className="chip-toggle">
                      <button type="button" className={autoStartNewSession ? 'is-active' : ''} onClick={() => setAutoStartNewSession(true)}>On</button>
                      <button type="button" className={!autoStartNewSession ? 'is-active' : ''} onClick={() => setAutoStartNewSession(false)}>Off</button>
                    </div>
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: 14 }}>
                  <div className="settings-row">
                    <div className="settings-row__content"><div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Insight alerts</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keep recommendation updates visible in the UI.</div></div>
                    <div className="chip-toggle">
                      <button type="button" className={insightNotificationsEnabled ? 'is-active' : ''} onClick={() => setInsightNotificationsEnabled(true)}>Enabled</button>
                      <button type="button" className={!insightNotificationsEnabled ? 'is-active' : ''} onClick={() => setInsightNotificationsEnabled(false)}>Muted</button>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProfileDropdownOpen && (
            <motion.div className="floating-panel" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onClick={(event) => event.stopPropagation()}>
              <div className="floating-panel__content" style={{ gap: 14 }}>
                <div className="profile-panel__header">
                  <div className="message-avatar" style={{ width: 52, height: 52 }}>
                    {profilePictureUrl ? <img src={profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{displayName}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{userEmail || 'No email found'}</div>
                  </div>
                </div>
                <GradientButton variant="secondary" onClick={() => profileInputRef.current?.click()} style={{ width: '100%' }}>Change profile picture</GradientButton>
                <GradientButton variant="outline" onClick={() => { setProfileDropdownOpen(false); setSettingsPanelOpen(true); }} style={{ width: '100%' }}>Open settings</GradientButton>
                <GradientButton variant="secondary" onClick={handleLogout} style={{ width: '100%', color: 'var(--accent-red)' }}>Sign out</GradientButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messageStreamRef} className="message-stream">
          {messages.map((message, index) => (
            <motion.div key={`${message.id}-${index}`} className={`message-row ${message.sender === 'user' ? 'is-user' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div className="message-avatar">
                {message.sender === 'user'
                  ? (profilePictureUrl ? <img src={profilePictureUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} />)
                  : <ScanFace size={18} />}
              </div>
              <div className="message-bubble">
                {message.type === 'image_upload_prompt' && typeof message.data === 'string' ? (
                  <div className="message-bubble__content">
                    <img src={message.data} alt={message.text} className="message-bubble__image" />
                    <div style={{ fontSize: '0.9rem', opacity: 0.88 }}>{message.text}</div>
                  </div>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{toReadableText(message.text)}</p>
                )}
                <div className="message-bubble__meta">
                  <span style={{ fontSize: '0.76rem', opacity: 0.72 }}>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {selectedSessionId && (
                    <button type="button" onClick={() => void rewindToIndex(index)} style={{ fontSize: '0.76rem', fontWeight: 800, color: message.sender === 'user' ? 'rgba(255,255,255,0.92)' : 'var(--accent-blue)' }}>
                      Rewind here
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="message-row">
              <div className="message-avatar"><ScanFace size={18} /></div>
              <div className="message-bubble typing-indicator">
                {[0, 1, 2].map((item) => (
                  <motion.span key={item} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: item * 0.16 }} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="composer-shell">
          <form className="composer" onSubmit={handleSend}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <div className="composer-attachment">
              <button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); setShowImageOptions((prev) => !prev); }}><ImageIcon size={18} /></button>
              <AnimatePresence>
                {showImageOptions && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="floating-panel composer-attachment-panel" onClick={(event) => event.stopPropagation()}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <GradientButton variant="secondary" onClick={handleTakePhoto} style={{ width: '100%' }}><Camera size={16} />Take Photo</GradientButton>
                      <GradientButton variant="outline" onClick={() => fileInputRef.current?.click()} style={{ width: '100%' }}><ImageIcon size={16} />Choose from Gallery</GradientButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input type="text" placeholder="Ask RoboMedic about your skin, routine, or analysis..." value={inputValue} onChange={(event) => setInputValue(event.target.value)} disabled={uploadingImage} />
            <button type="submit" className="icon-button" disabled={isTyping || uploadingImage} style={{ width: 52, height: 52 }}>
              {isTyping || uploadingImage ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Sparkles size={18} /></motion.span>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </main>

      <AnimatePresence>
        {isLeftMenuOpen && (
          <motion.aside
            className="chat-drawer chat-drawer--left chat-pane"
            initial={{ x: '-100%', opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0.7 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="chat-drawer__header">
              <div className="brand-lockup">
                <span className="brand-lockup__mark"><ScanFace size={20} /></span>
                <span className="brand-lockup__text"><strong>RoboMedic</strong><span>Consultation workspace</span></span>
              </div>
              <button type="button" className="icon-button" onClick={() => setLeftMenuOpen(false)} aria-label="Close left menu">
                <ChevronLeft size={18} />
              </button>
            </div>
            <div className="chat-drawer__body">
              <GradientButton onClick={() => void handleNewAnalysis()} disabled={isTyping || uploadingImage} style={{ width: '100%' }}>
                <Plus size={18} />
                New Analysis
              </GradientButton>
              <div className="sidebar-user-compact">
                <div className="sidebar-user-compact__avatar">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="sidebar-user-compact__meta">
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {userEmail || 'Awaiting account data'}
                  </div>
                </div>
              </div>
              <div className="chat-panel">
                <div className="chat-panel__heading">
                  <div className="chat-panel__label">Sessions</div>
                  <button type="button" className="icon-button" onClick={() => { setSearchPanelOpen(true); setLeftMenuOpen(false); }}><Search size={16} /></button>
                </div>
                <div className="session-list">
                  {savedSessions.length === 0 ? (
                    <GlassCard style={{ padding: 16 }}><p style={{ fontSize: '0.9rem' }}>No saved sessions yet. Start a new consultation to begin.</p></GlassCard>
                  ) : (
                    savedSessions.map((session) => {
                      const isActive = selectedSessionId === session.session_id;
                      return (
                        <div key={session.session_id} className={`session-card ${isActive ? 'is-active' : ''}`}>
                          <button type="button" className="session-card__trigger" onClick={() => { void loadSession(session.session_id); setLeftMenuOpen(false); }}>
                            <div className="session-card__summary">
                              <span className="session-card__icon">
                                <MessageSquare size={16} />
                              </span>
                              <div className="session-card__copy">
                                <div className="session-card__title" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                  {session.session_name || session.last_message || `Session ${session.session_id.slice(0, 8)}`}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Updated {new Date(session.updated_at).toLocaleString()}</div>
                              </div>
                            </div>
                          </button>
                          <div className="session-card__actions">
                            <button type="button" className="session-action" title="Rename session" onClick={(event) => { event.stopPropagation(); void handleRenameSession(session.session_id, session.session_name); }}>
                              <Edit3 size={14} />
                            </button>
                            <button type="button" className="session-action" title="Delete session" style={{ color: 'var(--accent-red)' }} onClick={(event) => { event.stopPropagation(); void handleDeleteSession(session.session_id); }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <button type="button" className="chat-signout" onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRightMenuOpen && (
          <motion.aside
            className="chat-drawer chat-drawer--right chat-pane"
            initial={{ x: '100%', opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.7 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="chat-drawer__header">
              <div className="eyebrow"><Activity size={16} color="var(--accent-blue)" />Live insights</div>
              <button type="button" className="icon-button" onClick={() => setRightMenuOpen(false)} aria-label="Close right menu">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="chat-drawer__body">
              <div className="insights-header">
                <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Session intelligence</h3>
                <p style={{ fontSize: '0.92rem' }}>Analysis metrics, cached findings, and skincare recommendations stay visible here.</p>
              </div>
              <div className="insights-scroll">
                <div className="insight-card-grid">
                  {insightCards.map((card) => (
                    <GlassCard key={card.label} className="insight-card">
                      <div className="insight-card__label">{card.label.toUpperCase()}</div>
                      <div className="insight-card__value">{card.value}</div>
                      <p style={{ fontSize: '0.86rem' }}>{card.note}</p>
                    </GlassCard>
                  ))}
                </div>
                <GlassCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><strong style={{ color: 'var(--text-primary)' }}>Cached analysis</strong><ScanFace size={16} color="var(--accent-blue)" /></div>
                  {analysisFindings.length > 0 ? (
                    <div className="analysis-tags">
                      {analysisFindings.map((finding) => (
                        <span key={finding} className="analysis-tag">{finding}</span>
                      ))}
                    </div>
                  ) : <p style={{ fontSize: '0.9rem' }}>Upload a face photo in this session to cache issue findings here.</p>}
                </GlassCard>
                <GlassCard style={{ minWidth: 0 }}>
                  <div className="section-header" style={{ marginBottom: 14 }}><strong style={{ color: 'var(--text-primary)' }}>Recommended routine</strong><Calendar size={16} color="var(--text-muted)" /></div>
                  {recommendationsFetchingForSession === selectedSessionId ? (
                    <p style={{ fontSize: '0.9rem' }}>Refreshing recommendations...</p>
                  ) : recommendations || routineSteps.length > 0 ? (
                    <div className="recommendations-list">
                      {(recommendations?.products ?? []).map((product, index) => (
                        <div key={`product-${index}`} className="recommendation-card">
                          <div className="recommendation-card__title">{toReadableText(product)}</div>
                          <div className="recommendation-card__meta">Product recommendation</div>
                        </div>
                      ))}
                      {routineSteps.map((step, index) => (
                        <div key={`step-${index}`} className="recommendation-card">
                          <div className="recommendation-card__title">{toReadableText(step)}</div>
                          <div className="recommendation-card__meta">Routine step</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <p style={{ fontSize: '0.9rem' }}>Recommendations will appear once your session has enough profile and analysis context.</p>
                      <GradientButton variant="secondary" onClick={() => void fetchRecommendations()} disabled={!selectedSessionId || recommendationsFetchingForSession === selectedSessionId} style={{ width: '100%' }}>Fetch recommendations</GradientButton>
                    </div>
                  )}
                </GlassCard>
                <GlassCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><strong style={{ color: 'var(--text-primary)' }}>Daily tip</strong><Sparkles size={16} color="var(--accent-blue)" /></div>
                  <p style={{ fontSize: '0.9rem' }}>Consistent nightly cleansing helps remove sunscreen and urban buildup, which reduces congestion and keeps other steps working properly.</p>
                  {currentCache?.recommendations?.cachedAt && <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cached recommendations updated {new Date(currentCache.recommendations.cachedAt).toLocaleString()}</div>}
                </GlassCard>
                {insightNotificationsEnabled && recommendations && (
                  <div className="insight-sync-banner">
                    Recommendations are synced for this session.
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCameraModal && (
          <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
              <div className="camera-modal__header">
                <div><h3 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Capture a photo</h3><p style={{ fontSize: '0.9rem' }}>Use your camera to analyze your current skin condition.</p></div>
                <button type="button" className="icon-button" onClick={stopCamera}><Trash2 size={16} /></button>
              </div>
              <div className="camera-modal__frame">
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="camera-modal__actions">
                <GradientButton variant="secondary" onClick={stopCamera}>Cancel</GradientButton>
                <GradientButton onClick={handleCapturePhoto}><Camera size={16} />Capture Photo</GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={profileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImageChange} />
    </div>
  );
};

export default ChatPage;
