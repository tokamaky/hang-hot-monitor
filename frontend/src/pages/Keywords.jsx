import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { useKeywords } from '../hooks/useKeywords.js';

export default function Keywords() {
  const {
    keywords,
    loading,
    error,
    fetchKeywords,
    addKeyword,
    deleteKeyword,
  } = useKeywords();
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsAdding(true);
    try {
      await addKeyword(inputValue.trim());
      setInputValue('');
    } catch (err) {
      console.error('Error adding keyword:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteKeyword = async (id) => {
    if (!confirm('确定删除此关键词吗？')) return;

    try {
      setDeleteError(null);
      await deleteKeyword(id);
    } catch (err) {
      setDeleteError(err.message);
      console.error('Error deleting keyword:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <h1 className="text-3xl font-bold gradient-text">监控关键词</h1>
        <p className="text-gray-600 mt-2">添加或管理您要监控的关键词</p>
      </div>

      {/* Add Keyword Form */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <h2 className="text-xl font-bold text-gray-800 mb-4">➕ 添加新关键词</h2>
        <form onSubmit={handleAddKeyword} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入关键词（如：AI、大模型、ChatGPT）"
            className="flex-1 px-4 py-3 rounded-lg border border-white/20 glass focus:outline-none focus:border-red-500 transition"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding || !inputValue.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {isAdding ? '添加中...' : '添加'}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>

      {/* Keywords List */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📋 关键词列表 ({keywords.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : keywords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>暂无关键词</p>
            <p className="text-sm mt-2">添加关键词开始监控</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keywords.map((keyword) => (
              <div
                key={keyword.id}
                className="p-4 bg-white/10 rounded-lg border border-white/20 flex items-center justify-between group card-hover"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {keyword.keyword}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    添加于 {new Date(keyword.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteKeyword(keyword.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="删除关键词"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {deleteError && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {deleteError}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="glass p-4 rounded-lg border border-white/20 bg-blue-500/10">
        <p className="text-sm text-blue-900 font-semibold">💡 提示</p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
          <li>每个关键词会每30分钟自动监控一次</li>
          <li>系统会从多个来源（Web、Twitter等）获取相关热点</li>
          <li>有匹配的热点时会自动发送邮件通知</li>
        </ul>
      </div>
    </div>
  );
}
