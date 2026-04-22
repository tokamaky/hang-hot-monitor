import React from 'react';
import { ExternalLink, Flame } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date-utils.js';

export default function HotspotCard({ hotspot }) {
  const sourceColors = {
    web: 'bg-blue-100 text-blue-700',
    twitter: 'bg-cyan-100 text-cyan-700',
    reddit: 'bg-orange-100 text-orange-700',
    default: 'bg-gray-100 text-gray-700',
  };

  const sourceColor = sourceColors[hotspot.source] || sourceColors.default;

  return (
    <div className="card-hover glass p-4 rounded-lg border border-white/20 hover:border-white/40">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 line-clamp-2">
            {hotspot.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge ${sourceColor}`}>
              {hotspot.source.toUpperCase()}
            </span>
            {hotspot.ai_score && (
              <span className="badge badge-info">
                热度: {hotspot.ai_score.toFixed(1)}/10
              </span>
            )}
          </div>
        </div>
        <Flame className="w-5 h-5 text-red-500 flex-shrink-0" />
      </div>

      {/* Content */}
      {hotspot.content && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-3">
          {hotspot.content}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(hotspot.created_at))}前
        </span>
        {hotspot.url && (
          <a
            href={hotspot.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
          >
            查看
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
