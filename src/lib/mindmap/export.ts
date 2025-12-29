import { toPng, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';
import type { MindMapData } from '../../types';
import { downloadFile as utilsDownloadFile } from '../utils';

function getMindmapContainer(): HTMLElement | null {
  return document.querySelector('[data-mindmap-container]');
}

export async function exportAsPNG(_mindmap: MindMapData, filename: string) {
  const element = getMindmapContainer();
  if (!element) throw new Error('Mindmap container not found');

  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  utilsDownloadFile(dataUrl, filename + '.png', 'image/png');
}

export async function exportAsSVG(_mindmap: MindMapData, filename: string) {
  const element = getMindmapContainer();
  if (!element) throw new Error('Mindmap container not found');

  const dataUrl = await toSvg(element, {
    backgroundColor: '#ffffff',
  });

  utilsDownloadFile(dataUrl, filename + '.svg', 'image/svg+xml');
}

export async function exportAsPDF(_mindmap: MindMapData, filename: string) {
  const element = getMindmapContainer();
  if (!element) throw new Error('Mindmap container not found');

  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF({
    orientation: element.offsetWidth > element.offsetHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [element.offsetWidth + 40, element.offsetHeight + 40],
  });

  pdf.addImage(dataUrl, 'PNG', 20, 20, element.offsetWidth, element.offsetHeight);
  pdf.save(filename + '.pdf');
}

export async function exportAsMarkdown(mindmap: MindMapData, filename: string) {
  let markdown = `# ${mindmap.title}\n\n`;

  function renderNode(node: any, depth: number = 0) {
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '' : '- ';
    markdown += `${indent}${prefix}${node.content}\n`;
    node.children.forEach((child: any) => renderNode(child, depth + 1));
  }

  renderNode(mindmap.root);
  utilsDownloadFile(markdown, filename + '.md', 'text/markdown');
}

export async function exportAsJSON(mindmap: MindMapData, filename: string) {
  const json = JSON.stringify(mindmap, null, 2);
  utilsDownloadFile(json, filename + '.json', 'application/json');
}

// Legacy export functions
export function exportToJSON(data: any): string {
  return JSON.stringify({ version: '1.0', format: 'aimind', data }, null, 2);
}

export function exportToMarkdown(data: any): string {
  let markdown = `# ${data.title}\n\n`;
  const traverse = (node: any, depth: number) => {
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '' : '- ';
    markdown += `${indent}${prefix}${node.content}\n`;
    node.children.forEach((child: any) => traverse(child, depth + 1));
  };
  traverse(data.root, 0);
  return markdown;
}

export function exportToOutline(data: any): string {
  let outline = '';
  const traverse = (node: any, depth: number) => {
    const indent = '    '.repeat(depth);
    outline += `${indent}${node.content}\n`;
    node.children.forEach((child: any) => traverse(child, depth + 1));
  };
  traverse(data.root, 0);
  return outline;
}

export function importFromJSON(json: string): any | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.format === 'aimind' && parsed.data) {
      return parsed.data;
    }
  } catch {
    return null;
  }
  return null;
}

export async function exportMindmap(data: any, options: any): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${data.title}-${timestamp}`;

  switch (options.format) {
    case 'json':
      utilsDownloadFile(exportToJSON(data), `${filename}.imind`, 'application/json');
      break;
    case 'markdown':
      utilsDownloadFile(exportToMarkdown(data), `${filename}.md`, 'text/markdown');
      break;
    case 'png':
      await exportAsPNG(data, filename);
      break;
    case 'svg':
      await exportAsSVG(data, filename);
      break;
    case 'pdf':
      await exportAsPDF(data, filename);
      break;
  }
}
