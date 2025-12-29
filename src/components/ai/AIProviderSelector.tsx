import React, { useState } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ChevronDown, Plus, Settings, Trash2, Check } from 'lucide-react';
import { getDefaultBaseURL, getDefaultModel } from '../../lib/ai/providers';

export const AIProviderSelector: React.FC = () => {
  const { config, currentProvider, setCurrentProvider, addProvider, updateProvider, deleteProvider } =
    useAIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProvider, setEditingProvider] = useState<import('../../types').AIProvider | null>(null);

  const handleAddProvider = () => {
    const newProvider: import('../../types').AIProvider = {
      id: `provider-${Date.now()}`,
      name: '新配置',
      type: 'openai',
      baseURL: getDefaultBaseURL('openai'),
      model: getDefaultModel('openai'),
      temperature: 0.7,
      maxTokens: 2000,
      enabled: true,
    };
    addProvider(newProvider);
    setEditingProvider(newProvider);
    setShowSettings(true);
  };

  const handleSaveProvider = () => {
    if (editingProvider) {
      updateProvider(editingProvider.id, editingProvider);
      setEditingProvider(null);
      setShowSettings(false);
    }
  };

  const handleDeleteProvider = (id: string) => {
    if (config.providers.length <= 1) {
      alert('至少保留一个配置');
      return;
    }
    if (confirm('确定删除此配置？')) {
      deleteProvider(id);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentProvider?.name || '选择AI服务'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            {config.providers
              .filter((p) => p.enabled)
              .map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setCurrentProvider(provider.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    currentProvider?.id === provider.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-sm">{provider.name}</span>
                  {currentProvider?.id === provider.id && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowSettings(true);
                }}
                className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                管理配置
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 配置管理对话框 */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="AI 服务配置" size="lg">
        <div className="space-y-4">
          {config.providers.map((provider) => (
            <div
              key={provider.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={provider.enabled}
                    onChange={(e) =>
                      updateProvider(provider.id, { enabled: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Input
                    value={provider.name}
                    onChange={(e) =>
                      setEditingProvider({ ...provider, name: e.target.value })
                    }
                    onBlur={() => updateProvider(provider.id, { name: editingProvider?.name || provider.name })}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCurrentProvider(provider.id);
                      setEditingProvider(provider);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProvider(provider.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {editingProvider?.id === provider.id && (
                <div className="space-y-3 pl-6">
                  <Select
                    label="类型"
                    value={editingProvider.type}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        type: e.target.value as import('../../types').AIProvider['type'],
                        baseURL: getDefaultBaseURL(
                          e.target.value as import('../../types').AIProvider['type']
                        ),
                        model: getDefaultModel(
                          e.target.value as import('../../types').AIProvider['type']
                        ),
                      })
                    }
                    options={[
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'deepseek', label: 'DeepSeek' },
                      { value: 'anthropic', label: 'Anthropic' },
                      { value: 'ollama', label: 'Ollama (本地)' },
                      { value: 'custom', label: '自定义' },
                    ]}
                  />
                  <Input
                    label="API端点"
                    value={editingProvider.baseURL || ''}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, baseURL: e.target.value })
                    }
                    placeholder="https://api.openai.com/v1"
                  />
                  {editingProvider.type !== 'ollama' && editingProvider.type !== 'custom' && (
                    <Input
                      label="API密钥"
                      type="password"
                      value={editingProvider.apiKey || ''}
                      onChange={(e) =>
                        setEditingProvider({ ...editingProvider, apiKey: e.target.value })
                      }
                      placeholder="sk-..."
                    />
                  )}
                  {editingProvider.type === 'custom' && (
                    <Input
                      label="API密钥 (可选)"
                      type="password"
                      value={editingProvider.apiKey || ''}
                      onChange={(e) =>
                        setEditingProvider({ ...editingProvider, apiKey: e.target.value })
                      }
                      placeholder="如果服务需要认证请填写"
                    />
                  )}
                  <Input
                    label="模型"
                    value={editingProvider.model}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, model: e.target.value })
                    }
                    placeholder="gpt-4o-mini"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProvider} size="sm">
                      保存
                    </Button>
                    <Button
                      onClick={() => setEditingProvider(null)}
                      size="sm"
                      variant="secondary"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button
            onClick={handleAddProvider}
            variant="secondary"
            className="w-full"
          >
            <Plus className="w-4 h-4" />
            添加新配置
          </Button>
        </div>
      </Modal>
    </>
  );
};
