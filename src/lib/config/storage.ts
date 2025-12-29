import type { AppConfig } from '../../types/config';

const CONFIG_KEY = 'aimind-config';

const defaultConfig: AppConfig = {
  theme: 'ai-blue',
  autoSave: true,
  autoSaveInterval: 30000,
  defaultLayout: 'horizontal',
  recentFiles: [],
  maxRecentFiles: 10,
};

export async function loadConfig(): Promise<AppConfig> {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return defaultConfig;
}

export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

export function applyTheme(theme: AppConfig['theme']): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else if (theme === 'light' || theme === 'nature') {
    root.classList.add('light');
  } else {
    root.classList.add('dark');
  }

  root.setAttribute('data-theme', theme);
}
