import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown, Filter, X, Clock, Flame, TrendingUp, Target,
  ChevronDown, Check, RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Keyword } from '../services/api';
import { useI18n } from '../i18n/index.tsx';

export interface FilterState {
  source: string;
  importance: string;
  keywordId: string;
  timeRange: string;
  isReal: string;
  sortBy: string;
  sortOrder: string;
}

export const defaultFilterState: FilterState = {
  source: '',
  importance: '',
  keywordId: '',
  timeRange: '',
  isReal: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

interface FilterSortBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  keywords: Keyword[];
}

function Dropdown({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string; color?: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  const isActive = value !== '';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
          isActive
            ? "text-violet-400"
            : "text-slate-400 hover:text-slate-200"
        )}
        style={isActive ? { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span>{isActive ? selected?.label : label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-xl overflow-hidden"
              style={{ background: 'rgba(9,9,26,0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { onChange(option.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors text-left",
                    value === option.value
                      ? "text-violet-400"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  )}
                  style={value === option.value ? { background: 'rgba(124,58,237,0.08)' } : {}}
                >
                  {value === option.value && <Check className="w-3 h-3 shrink-0" />}
                  <span className={cn(option.color)}>{option.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FilterSortBar({ filters, onChange, keywords }: FilterSortBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useI18n();

  const sortOpts = [
    { value: 'createdAt', label: t.filters.latestFound, icon: Clock },
    { value: 'publishedAt', label: t.filters.latestPublished, icon: Clock },
    { value: 'importance', label: t.filters.importance, icon: Flame },
    { value: 'relevance', label: t.filters.relevance, icon: Target },
    { value: 'hot', label: t.filters.heatScore, icon: TrendingUp },
  ];

  const sourceOpts = [
    { value: '', label: t.filters.allSources },
    { value: 'twitter', label: 'Twitter' },
    { value: 'bing', label: 'Bing' },
    { value: 'google', label: 'Google' },
    { value: 'sogou', label: t.sources.sogou },
    { value: 'bilibili', label: t.sources.bilibili },
    { value: 'weibo', label: t.sources.weibo },
    { value: 'hackernews', label: t.sources.hackernews },
    { value: 'duckduckgo', label: t.sources.duckduckgo },
  ];

  const importanceOpts = [
    { value: '', label: t.filters.allLevels },
    { value: 'urgent', label: t.filters.urgent, color: 'text-red-400' },
    { value: 'high', label: t.filters.high, color: 'text-purple-400' },
    { value: 'medium', label: t.filters.medium, color: 'text-amber-400' },
    { value: 'low', label: t.filters.low, color: 'text-emerald-400' },
  ];

  const timeRangeOpts = [
    { value: '', label: t.filters.allTime },
    { value: '1h', label: t.filters.last1h },
    { value: 'today', label: t.filters.today },
    { value: '7d', label: t.filters.last7d },
    { value: '30d', label: t.filters.last30d },
  ];

  const realOpts = [
    { value: '', label: t.filters.all },
    { value: 'true', label: `✅ ${t.filters.real}` },
    { value: 'false', label: `⚠️ ${t.filters.suspectedFake}` },
  ];

  const activeFilterCount = [
    filters.source,
    filters.importance,
    filters.keywordId,
    filters.timeRange,
    filters.isReal,
  ].filter(v => v !== '').length;

  const hasNonDefaultSort = filters.sortBy !== 'createdAt';

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange({ ...defaultFilterState });
  };

  const keywordOptions = [
    { value: '', label: t.filters.allKeywords },
    ...keywords.filter(k => k.isActive).map(k => ({ value: k.id, label: k.text })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 ml-1.5" />
          {sortOpts.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => update('sortBy', opt.value)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                  filters.sortBy === opt.value
                    ? "text-violet-300"
                    : "text-slate-500 hover:text-slate-300"
                )}
                style={filters.sortBy === opt.value ? { background: 'rgba(124,58,237,0.12)' } : {}}
              >
                <Icon className="w-3 h-3" />
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all",
            showFilters || activeFilterCount > 0 ? "text-violet-400" : "text-slate-500"
          )}
          style={showFilters || activeFilterCount > 0
            ? { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
          }
        >
          <Filter className="w-3.5 h-3.5" />
          {t.filters.filter}
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{ background: '#7c3aed' }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {(activeFilterCount > 0 || hasNonDefaultSort) && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            {t.filters.reset}
          </button>
        )}

        {activeFilterCount > 0 && !showFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.source && (
              <FilterTag
                label={sourceOpts.find(o => o.value === filters.source)?.label || filters.source}
                onRemove={() => update('source', '')}
              />
            )}
            {filters.importance && (
              <FilterTag
                label={importanceOpts.find(o => o.value === filters.importance)?.label || filters.importance}
                onRemove={() => update('importance', '')}
              />
            )}
            {filters.keywordId && (
              <FilterTag
                label={keywords.find(k => k.id === filters.keywordId)?.text || t.filters.keyword}
                onRemove={() => update('keywordId', '')}
              />
            )}
            {filters.timeRange && (
              <FilterTag
                label={timeRangeOpts.find(o => o.value === filters.timeRange)?.label || filters.timeRange}
                onRemove={() => update('timeRange', '')}
              />
            )}
            {filters.isReal && (
              <FilterTag
                label={realOpts.find(o => o.value === filters.isReal)?.label || t.filters.authenticity}
                onRemove={() => update('isReal', '')}
              />
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Dropdown label={t.filters.source} value={filters.source} options={sourceOpts} onChange={(v) => update('source', v)} />
              <Dropdown label={t.filters.importance} value={filters.importance} options={importanceOpts} onChange={(v) => update('importance', v)} />
              <Dropdown label={t.filters.keyword} value={filters.keywordId} options={keywordOptions} onChange={(v) => update('keywordId', v)} />
              <Dropdown label={t.filters.time} value={filters.timeRange} options={timeRangeOpts} onChange={(v) => update('timeRange', v)} />
              <Dropdown label={t.filters.authenticity} value={filters.isReal} options={realOpts} onChange={(v) => update('isReal', v)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium"
      style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.15)' }}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
