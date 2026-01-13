// src/components/ConfirmModal.jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react'; // 引入一个警告图标和关闭图标

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "确认操作", 
  description, 
  confirmText = "确定",
  cancelText = "取消",
  danger = false // 新增：是否为危险操作（如删除），如果是，按钮变红
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* 1. 背景遮罩：纯净的黑色半透明，带轻微模糊 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      ></div>

      {/* 2. 弹窗主体：白底、标准圆角、微阴影 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* 关闭按钮 (右上角) - 可选，增加易用性 */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* 头部：图标 + 标题 (左对齐或居中，这里采用居中更显正式) */}
          <div className="flex flex-col items-center text-center">
            {/* 图标：简洁的灰色圆底 */}
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
              <AlertCircle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {title}
            </h3>

            <div className="mt-2">
              <p className="text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* 底部按钮区域：灰底分隔或直接白底 */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 sm:flex-row flex-col-reverse">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors shadow-sm"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
              ${danger 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;