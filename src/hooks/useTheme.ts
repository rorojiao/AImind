import { useEffect } from 'react';
import { useConfigStore } from '../stores/configStore';

// 主题颜色配置
const themes = {
  light: {
    bg: '#ffffff',
    surface: '#f3f4f6',
    border: '#e5e7eb',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  dark: {
    bg: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
  },
  'ai-blue': {
    bg: '#0f172a',
    surface: '#1e3a5f',
    border: '#1e40af',
    text: '#e0e7ff',
    textSecondary: '#93c5fd',
  },
  nature: {
    bg: '#f0fdf4',
    surface: '#dcfce7',
    border: '#86efac',
    text: '#14532d',
    textSecondary: '#166534',
  },
  system: {
    bg: '#ffffff',
    surface: '#f3f4f6',
    border: '#e5e7eb',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
};

export function useTheme() {
  const { appConfig, setAppConfig } = useConfigStore();

  // 处理 system 主题
  const getEffectiveTheme = () => {
    if (appConfig.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return appConfig.theme;
  };

  const effectiveTheme = getEffectiveTheme();
  const theme = themes[effectiveTheme as keyof typeof themes] || themes['ai-blue'];

  // 应用主题到DOM
  useEffect(() => {
    const root = document.documentElement;

    // 移除旧主题类
    root.classList.remove('light', 'dark');

    // 添加新主题类
    if (effectiveTheme === 'light' || effectiveTheme === 'nature') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }

    // 设置CSS变量
    root.style.setProperty('--color-bg', theme.bg);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-border', theme.border);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
  }, [appConfig.theme, theme, effectiveTheme]);

  return {
    theme: appConfig.theme,
    colors: theme,
    setTheme: (theme: 'light' | 'dark' | 'ai-blue' | 'nature' | 'system') => {
      setAppConfig({ theme });
    },
  };
}
