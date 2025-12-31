import type { MindMapData } from '../../types';

/**
 * 模拟的云存储API
 * 在实际部署中,这些会连接到真实的后端服务
 */

// 服务器上的思维导图文件
interface ServerFile {
  id: string;
  title: string;
  content: MindMapData;
  createdAt: number;
  updatedAt: number;
  owner: string; // 文件所有者
}

// 从localStorage获取用户ID
const getUserId = () => {
  let userId = localStorage.getItem('aimind_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('aimind_user_id', userId);
  }
  return userId;
};

// 模拟服务器数据库(使用localStorage存储)
const getServerDatabase = (): ServerFile[] => {
  try {
    const data = localStorage.getItem('aimind_server_files');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveServerDatabase = (files: ServerFile[]) => {
  try {
    localStorage.setItem('aimind_server_files', JSON.stringify(files));
  } catch (error) {
    console.error('Failed to save server database:', error);
  }
};

/**
 * 保存思维导图到服务器
 */
export async function saveToServer(
  mindmap: MindMapData,
  title?: string
): Promise<ServerFile> {
  const userId = getUserId();
  const files = getServerDatabase();

  // 查找是否已存在该文件
  const existingIndex = files.findIndex(
    (f) => f.id === mindmap.id && f.owner === userId
  );

  const serverFile: ServerFile = {
    id: mindmap.id,
    title: title || mindmap.root.content,
    content: mindmap,
    createdAt: existingIndex >= 0 ? files[existingIndex].createdAt : Date.now(),
    updatedAt: Date.now(),
    owner: userId,
  };

  if (existingIndex >= 0) {
    // 更新现有文件
    files[existingIndex] = serverFile;
  } else {
    // 创建新文件
    files.push(serverFile);
  }

  saveServerDatabase(files);

  return serverFile;
}

/**
 * 从服务器加载思维导图
 */
export async function loadFromServer(fileId: string): Promise<MindMapData | null> {
  const userId = getUserId();
  const files = getServerDatabase();

  const file = files.find((f) => f.id === fileId && f.owner === userId);

  if (!file) {
    return null;
  }

  return file.content;
}

/**
 * 获取用户的所有文件列表
 */
export async function listServerFiles(): Promise<ServerFile[]> {
  const userId = getUserId();
  const files = getServerDatabase();

  // 只返回当前用户的文件,按更新时间倒序
  return files
    .filter((f) => f.owner === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 删除服务器上的文件
 */
export async function deleteFromServer(fileId: string): Promise<boolean> {
  const userId = getUserId();
  const files = getServerDatabase();

  const filteredFiles = files.filter((f) => !(f.id === fileId && f.owner === userId));

  if (filteredFiles.length === files.length) {
    return false; // 文件不存在或无权限
  }

  saveServerDatabase(filteredFiles);
  return true;
}

/**
 * 重命名服务器上的文件
 */
export async function renameServerFile(
  fileId: string,
  newTitle: string
): Promise<boolean> {
  const userId = getUserId();
  const files = getServerDatabase();

  const file = files.find((f) => f.id === fileId && f.owner === userId);

  if (!file) {
    return false;
  }

  file.title = newTitle;
  file.updatedAt = Date.now();

  saveServerDatabase(files);
  return true;
}

/**
 * 创建新文件(自动生成唯一ID)
 */
export async function createServerFile(title: string): Promise<MindMapData> {
  const id = 'mindmap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const now = Date.now();

  return {
    id,
    title,
    root: {
      id: 'root',
      content: title,
      type: 'root',
      children: [],
      position: { x: 0, y: 0 },
      collapsed: false,
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 2,
        textColor: '#ffffff',
        fontSize: 16,
        fontWeight: 600,
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        shape: 'rounded',
      },
      metadata: {
        created: now,
        modified: now,
        aiGenerated: false,
      },
    },
    layout: 'horizontal',
    theme: 'ai-blue',
    edgeStyle: 'curve',
    created: now,
    modified: now,
  };
}
