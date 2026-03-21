export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'robo_theme_preference';
const THEME_EVENT_NAME = 'robo-theme-change';
const THEME_ATTRIBUTE = 'data-theme';

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

const getUserThemeKey = (email: string) => `${THEME_STORAGE_KEY}:${email.trim().toLowerCase()}`;

export const getThemePreference = (email?: string | null): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    const storedForUser = window.localStorage.getItem(getUserThemeKey(normalizedEmail));
    if (isThemeMode(storedForUser)) {
      return storedForUser;
    }
  }

  const storedGlobal = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(storedGlobal) ? storedGlobal : 'system';
};

export const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return mode;
};

export const applyThemePreference = (mode: ThemeMode): 'light' | 'dark' => {
  const resolvedTheme = resolveTheme(mode);

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }

  return resolvedTheme;
};

export const setThemePreference = (mode: ThemeMode, email?: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    window.localStorage.setItem(getUserThemeKey(normalizedEmail), mode);
  }

  applyThemePreference(mode);
  window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: { mode, email: normalizedEmail ?? null } }));
};

export const syncThemePreference = (email?: string | null): ThemeMode => {
  const mode = getThemePreference(email);
  applyThemePreference(mode);
  return mode;
};

export const themePreferenceEventName = THEME_EVENT_NAME;
