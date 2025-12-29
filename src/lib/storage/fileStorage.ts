import type { MindMapData } from '../../types';

/**
 * Download mindmap as JSON file
 */
export function downloadAsJSON(mindmap: MindMapData, filename?: string): void {
  const data = JSON.stringify(mindmap, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${mindmap.root.content}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Upload and parse JSON file
 */
export async function uploadFromJSON(file: File): Promise<MindMapData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as MindMapData;

        // Basic validation
        if (!data.root || !data.root.id || !data.root.content) {
          throw new Error('Invalid mindmap file format');
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse JSON file: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Create file input element and trigger file selection dialog
 */
export function selectJSONFile(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error('No file selected'));
      }
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    input.click();
  });
}
