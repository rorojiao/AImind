import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface GuideStep {
  title: string;
  content: string;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  target?: string; // CSS selector for target element
}

const guideSteps: GuideStep[] = [
  {
    title: '欢迎来到 AImind! 🎉',
    content: '一款强大的AI思维导图工具。让我们快速了解主要功能。',
  },
  {
    title: '创建节点 ⌨️',
    content: '按 Tab 键添加子节点，Enter 键添加兄弟节点。快捷键让思维更流畅!',
  },
  {
    title: '编辑内容 ✏️',
    content: '双击节点或按 Space 键进入编辑模式。支持中文输入法!',
  },
  {
    title: '右键菜单 🖱️',
    content: '右键点击节点打开快捷菜单,包含所有常用操作。',
  },
  {
    title: '云端保存 ☁️',
    content: '点击云朵图标保存到服务器,方便后续协作。别忘了用下载按钮备份!',
  },
  {
    title: 'AI辅助 🤖',
    content: '右侧面板提供AI功能,帮助扩展思路。配置你的AI服务开始使用。',
  },
  {
    title: '开始创作! 🚀',
    content: '你已掌握基础,尽情探索更多功能吧。按 ? 键随时查看快捷键帮助。',
  },
];

interface OnboardingGuideProps {
  onComplete: () => void;
  skip?: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  onComplete,
  skip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 检查是否已完成引导
    const hasCompleted = localStorage.getItem('aimind_onboarding_completed');
    if (hasCompleted) {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('aimind_onboarding_completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('aimind_onboarding_completed', 'true');
    setIsVisible(false);
    skip?.();
  };

  if (!isVisible) return null;

  const step = guideSteps[currentStep];
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in">
        {/* 进度条 */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="跳过引导"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* 内容 */}
        <div className="p-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4">
              <span className="text-2xl">{getEmoji(currentStep)}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {step.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* 步骤指示器 */}
          <div className="flex justify-center gap-2 mb-6">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-blue-500'
                    : index < currentStep
                    ? 'w-2 bg-blue-300'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
            >
              {currentStep === guideSteps.length - 1 ? '开始使用' : '下一步'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getEmoji(step: number): string {
  const emojis = ['👋', '⌨️', '✏️', '🖱️', '☁️', '🤖', '🚀'];
  return emojis[step] || '💡';
}
