import React from 'react';
import { Mail, Bell, BarChart3 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <h1 className="text-3xl font-bold gradient-text">设置</h1>
        <p className="text-gray-600 mt-2">配置系统偏好和通知选项</p>
      </div>

      {/* Notification Settings */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold text-gray-800">通知设置</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">网页内通知</p>
              <p className="text-sm text-gray-600 mt-1">在网页中实时显示新热点</p>
            </div>
            <label className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="w-11 h-6 bg-gray-300 rounded-full"></div>
              <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">邮件通知</p>
              <p className="text-sm text-gray-600 mt-1">
                当发现匹配的热点时发送邮件
              </p>
            </div>
            <label className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="w-11 h-6 bg-gray-300 rounded-full"></div>
              <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">每日摘要</p>
              <p className="text-sm text-gray-600 mt-1">
                每天早上9点发送热点摘要邮件
              </p>
            </div>
            <label className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="w-11 h-6 bg-gray-300 rounded-full"></div>
              <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800">数据来源</h2>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">网页搜索</p>
                <p className="text-sm text-gray-600 mt-1">
                  来自搜索引擎的热点内容
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                ✓ 已启用
              </span>
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Twitter(X)API</p>
                <p className="text-sm text-gray-600 mt-1">
                  实时推文和热门话题
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                ⚠️ 需配置API Key
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-800">邮件配置</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              通知邮箱
            </label>
            <input
              type="email"
              placeholder="your-email@example.com"
              disabled
              className="w-full px-4 py-2 rounded-lg border border-white/20 glass bg-white/5 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-2">
              需要在服务器配置文件中修改 (来自后端 .env 配置)
            </p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <h2 className="text-xl font-bold text-gray-800 mb-4">关于系统</h2>
        <div className="space-y-2 text-gray-600">
          <p>
            <span className="font-semibold">版本:</span> 1.0.0
          </p>
          <p>
            <span className="font-semibold">更新频率:</span> 每30分钟
          </p>
          <p>
            <span className="font-semibold">AI识别:</span> OpenRouter API
          </p>
          <p className="text-sm text-gray-500 mt-4">
            热点监控系统由鱼皮工作室开发维护
          </p>
        </div>
      </div>
    </div>
  );
}
