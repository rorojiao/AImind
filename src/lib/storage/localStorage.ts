import type { MindMapData } from '../../types';
import type { AIConfig } from '../../types';
import type { SearchSourceConfig } from '../search/webSearchService';

const STORAGE_KEY = 'aimind_autosave';
const RECENT_FILES_KEY = 'aimind_recent_files';
const AI_CONFIG_KEY = 'aimind_ai_config';
const WEB_SEARCH_CONFIG_KEY = 'aimind_web_search_config';
const VERSIONS_KEY = 'aimind_versions';

// 版本信息接口
export interface MindMapVersion {
  id: string;
  mindmapId: string;
  title: string;
  timestamp: number;
  data: MindMapData;
  description?: string;
  isAutoSaved: boolean;
}

// 最多保存的版本数量
const MAX_VERSIONS = 20;
// 自动保存的版本数量限制
const MAX_AUTO_SAVED_VERSIONS = 5;

/**
 * Save mindmap to localStorage for auto-save
 */
export function saveToLocalStorage(mindmap: MindMapData): void {
  try {
    const data = JSON.stringify(mindmap);
    localStorage.setItem(STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Load mindmap from localStorage
 */
export function loadFromLocalStorage(): MindMapData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as MindMapData;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear auto-save data
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Save recent files list
 */
export function saveRecentFiles(recentFiles: Array<{ id: string; title: string; timestamp: number }>): void {
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
  } catch (error) {
    console.error('Failed to save recent files:', error);
  }
}

/**
 * Load recent files list
 */
export function loadRecentFiles(): Array<{ id: string; title: string; timestamp: number }> {
  try {
    const data = localStorage.getItem(RECENT_FILES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load recent files:', error);
    return [];
  }
}

/**
 * Save AI configuration to localStorage
 */
export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save AI config:', error);
  }
}

/**
 * Load AI configuration from localStorage
 */
export function loadAIConfig(): AIConfig | null {
  try {
    const data = localStorage.getItem(AI_CONFIG_KEY);
    if (!data) return null;
    return JSON.parse(data) as AIConfig;
  } catch (error) {
    console.error('Failed to load AI config:', error);
    return null;
  }
}

/**
 * 保存思维导图版本
 */
export function saveVersion(mindmap: MindMapData, description?: string, isAutoSaved: boolean = false): MindMapVersion {
  const versions = loadAllVersions();

  const newVersion: MindMapVersion = {
    id: `v${Date.now()}`,
    mindmapId: mindmap.id,
    title: mindmap.root.content,
    timestamp: Date.now(),
    data: mindmap,
    description,
    isAutoSaved,
  };

  // 添加新版本到开头
  versions.unshift(newVersion);

  // 如果是自动保存，只保留最近的几个自动保存版本
  const autoSavedVersions = versions.filter(v => v.isAutoSaved);
  const manualVersions = versions.filter(v => !v.isAutoSaved);

  let finalVersions: MindMapVersion[];

  if (isAutoSaved) {
    // 自动保存：保留最近的MAX_AUTO_SAVED_VERSIONS个自动版本 + 所有手动版本
    const recentAutoVersions = autoSavedVersions.slice(0, MAX_AUTO_SAVED_VERSIONS);
    finalVersions = [...recentAutoVersions, ...manualVersions];
  } else {
    // 手动保存：保留所有手动版本 + 最多MAX_AUTO_SAVED_VERSIONS个自动版本
    const recentAutoVersions = autoSavedVersions.slice(0, MAX_AUTO_SAVED_VERSIONS);
    finalVersions = [...manualVersions, ...recentAutoVersions];
  }

  // 总版本数量限制
  finalVersions = finalVersions.slice(0, MAX_VERSIONS);

  // 按时间戳倒序排列
  finalVersions.sort((a, b) => b.timestamp - a.timestamp);

  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(finalVersions));
  } catch (error) {
    console.error('Failed to save version:', error);
    // 如果存储失败，可能是空间不足，删除最旧的版本
    const trimmedVersions = finalVersions.slice(0, Math.floor(finalVersions.length / 2));
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(trimmedVersions));
    } catch (retryError) {
      console.error('Failed to save version even after trimming:', retryError);
    }
  }

  return newVersion;
}

/**
 * 加载所有版本
 */
export function loadAllVersions(): MindMapVersion[] {
  try {
    const data = localStorage.getItem(VERSIONS_KEY);
    if (!data) return [];
    return JSON.parse(data) as MindMapVersion[];
  } catch (error) {
    console.error('Failed to load versions:', error);
    return [];
  }
}

/**
 * 加载特定思维导图的所有版本
 */
export function loadVersionsForMindmap(mindmapId: string): MindMapVersion[] {
  const allVersions = loadAllVersions();
  return allVersions.filter(v => v.mindmapId === mindmapId);
}

/**
 * 恢复到指定版本
 */
export function restoreVersion(versionId: string): MindMapData | null {
  const versions = loadAllVersions();
  const version = versions.find(v => v.id === versionId);

  if (!version) {
    console.error('Version not found:', versionId);
    return null;
  }

  // 保存当前状态为新版本
  saveVersion(version.data, `恢复自版本: ${version.description || new Date(version.timestamp).toLocaleString()}`, false);

  return version.data;
}

/**
 * 删除指定版本
 */
export function deleteVersion(versionId: string): boolean {
  const versions = loadAllVersions();
  const filteredVersions = versions.filter(v => v.id !== versionId);

  if (filteredVersions.length === versions.length) {
    return false; // 没有找到要删除的版本
  }

  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(filteredVersions));
    return true;
  } catch (error) {
    console.error('Failed to delete version:', error);
    return false;
  }
}

/**
 * 清除所有版本
 */
export function clearAllVersions(): void {
  try {
    localStorage.removeItem(VERSIONS_KEY);
  } catch (error) {
    console.error('Failed to clear versions:', error);
  }
}

/**
 * Save web search configuration to localStorage
 */
export function saveWebSearchConfig(config: SearchSourceConfig): void {
  try {
    localStorage.setItem(WEB_SEARCH_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save web search config:', error);
  }
}

/**
 * Load web search configuration from localStorage
 */
export function loadWebSearchConfig(): SearchSourceConfig | null {
  try {
    const data = localStorage.getItem(WEB_SEARCH_CONFIG_KEY);
    if (!data) return null;
    return JSON.parse(data) as SearchSourceConfig;
  } catch (error) {
    console.error('Failed to load web search config:', error);
    return null;
  }
}

