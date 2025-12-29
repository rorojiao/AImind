// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 深度克隆对象
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// 格式化时间
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

// 下载文件
export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 计算节点树深度
export function getTreeDepth(node: import('../types').MindMapNode): number {
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(getTreeDepth));
}

// 计算节点总数
export function getNodeCount(node: import('../types').MindMapNode): number {
  return 1 + node.children.reduce((sum, child) => sum + getNodeCount(child), 0);
}

// 根据ID查找节点
export function findNodeById(
  node: import('../types').MindMapNode,
  id: string
): import('../types').MindMapNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

// 根据ID查找父节点
export function findParentNode(
  node: import('../types').MindMapNode,
  id: string
): import('../types').MindMapNode | null {
  for (const child of node.children) {
    if (child.id === id) return node;
    const found = findParentNode(child, id);
    if (found) return found;
  }
  return null;
}
