'use client'

import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Layers, MessageSquare, Send, Bot, Sparkles, RefreshCw, 
  Flag, X, Calendar, Target, Package, Users, FileText,
  LayoutDashboard, Settings, Plus, Edit3, DollarSign, History,
  Flame, Trophy, Star, Award, Rocket, Inbox, Download, Upload, Trash2,
  Check, AlertCircle, ChevronRight, ChevronLeft, MapPin, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Zap, Coffee, LogOut, Loader2
} from 'lucide-react';
import { WeeklyCycleModal } from './WeeklyCycleModal';
import { AnalyticsPage } from './AnalyticsPage';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';

// ============================================
// Constants
// ============================================

const GREETINGS = ["今日も一緒に頑張ろう", "いい感じだね", "今週もあと少し", "順調順調"];
const TASK_DONE_MSG = ["ナイス", "いいね", "その調子", "さすが"];
const WEEK_DONE_MSG = ["お疲れさま", "よく頑張った", "最高の週だった"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const isThisMonth = (dateStr, currentMonth) => {
  if (!dateStr) return false;
  const [m] = dateStr.split('/').map(Number);
  return m === Number(currentMonth);
};

// ============================================
// Confetti & Toast
// ============================================

const Confetti = ({ active }) => {
  if (!active) return null;
  const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 60 }, (_, i) => (
        <div key={i} className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`, top: '-10px',
            width: 6 + Math.random() * 6, height: 6 + Math.random() * 6,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random()}s`
          }} />
      ))}
      <style>{`@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}.animate-confetti{animation:confetti linear forwards}`}</style>
    </div>
  );
};

const Toast = ({ message, icon: Icon, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800';
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-toast">
      <div className={`${bg} text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3`}>
        {Icon && <Icon size={18} />}
        <span className="font-medium">{message}</span>
      </div>
      <style>{`@keyframes toast-in{0%{transform:translateX(-50%) translateY(20px);opacity:0}100%{transform:translateX(-50%) translateY(0);opacity:1}}.animate-toast{animation:toast-in 0.3s ease-out}`}</style>
    </div>
  );
};

// ============================================
// Initial State
// ============================================

const createInitialState = () => ({
  isOnboarded: false,
  yearlyGoal: { title: "", targetRevenue: 0, year: new Date().getFullYear(), why: "" },
  phases: [],
  currentPhaseId: null,
  goal: { title: "", targetRevenue: 0, unitPrice: 0 },
  currentMonth: String(new Date().getMonth() + 1),
  currentWeekStart: "",
  weekNumber: 1,
  streak: 0,
  level: 1,
  exp: 0,
  maxExp: 100,
  totalTasksCompleted: 0,
  deals: [],
  pipeline: { leads: 0, meetings: 0 },
  assets: { followers: 0, contents: 0, lineList: 0 },
  channels: [],
  weeklyHistory: [],
});

const createDemoState = () => ({
  isOnboarded: true,
  yearlyGoal: { title: "LINE構築代行で年商3000万", targetRevenue: 3000, year: 2025, why: "独立して家族との時間を確保する" },
  phases: [
    { id: 1, name: "基盤構築", period: "1-3月", targetRevenue: 100, description: "まず生活費レベルを安定させる", completed: true },
    { id: 2, name: "スケール準備", period: "4-6月", targetRevenue: 300, description: "外注・仕組み化のための資金確保", completed: false },
    { id: 3, name: "拡大期", period: "7-12月", targetRevenue: 500, description: "チーム化と新事業への投資", completed: false },
  ],
  currentPhaseId: 2,
  goal: { title: "月商300万でスケール資金確保", targetRevenue: 300, unitPrice: 50 },
  currentMonth: "2",
  currentWeekStart: "2/10",
  weekNumber: 6,
  streak: 3,
  level: 5,
  exp: 340,
  maxExp: 500,
  totalTasksCompleted: 47,
  deals: [
    { id: 1, client: "美容院A", amount: 50, date: "1/10", channel: "YouTube" },
    { id: 2, client: "整体院B", amount: 50, date: "1/20", channel: "X" },
    { id: 3, client: "飲食店C", amount: 50, date: "2/1", channel: "note" },
    { id: 4, client: "EC店舗D", amount: 50, date: "2/5", channel: "YouTube" },
    { id: 5, client: "クリニックE", amount: 50, date: "2/10", channel: "X" },
    { id: 6, client: "サロンF", amount: 50, date: "2/15", channel: "YouTube" },
  ],
  pipeline: { leads: 58, meetings: 12 },
  assets: { followers: 7670, contents: 296, lineList: 485 },
  channels: [
    { id: 1, name: "X", icon: "𝕏", kpiName: "相談DM", kpiTarget: 10, kpiCurrent: 7,
      weeklyFocus: "実績ツイート強化",
      tasks: { once: [{ id: 't1', title: "実績ツイートまとめ", done: true }, { id: 't2', title: "固定ツイにLP導線", done: false }],
        continuous: [{ id: 'c1', title: "毎日投稿", target: 7, current: 5, unit: "回" }, { id: 'c2', title: "見込み客にリプ", target: 20, current: 12, unit: "件" }] },
      backlog: ["引用RT企画", "スペース開催"],
      consecutiveMiss: 3 },
    { id: 2, name: "YouTube", icon: "▶", kpiName: "LINE登録", kpiTarget: 55, kpiCurrent: 48,
      weeklyFocus: "ショート毎日投稿",
      tasks: { once: [{ id: 't3', title: "成功事例インタビュー", done: false }, { id: 't4', title: "LINE構築の裏側動画", done: true }],
        continuous: [{ id: 'c3', title: "ショート投稿", target: 5, current: 4, unit: "本" }] },
      backlog: ["応募者インタビュー", "Q&A動画"],
      consecutiveMiss: 0 },
    { id: 3, name: "note", icon: "N", kpiName: "問い合わせ", kpiTarget: 8, kpiCurrent: 6,
      weeklyFocus: "事例記事に集中",
      tasks: { once: [{ id: 't5', title: "売上200万達成の裏側", done: true }, { id: 't6', title: "料金相場記事", done: false }],
        continuous: [{ id: 'c4', title: "週1記事", target: 1, current: 1, unit: "本" }] },
      backlog: ["事例記事③", "まとめ記事"],
      consecutiveMiss: 0 }
  ],
  weeklyHistory: [
    { week: "2/3週", channels: [
      { name: "X", kpi: 8, target: 10, focus: "実績ツイート強化", focusDone: true },
      { name: "YouTube", kpi: 52, target: 50, focus: "ショート毎日投稿", focusDone: true },
      { name: "note", kpi: 5, target: 8, focus: "事例記事に集中", focusDone: false }
    ], achieved: true, assets: { followers: 7550, contents: 288, lineList: 470 } },
    { week: "1/27週", channels: [
      { name: "X", kpi: 6, target: 10, focus: "実績ツイート強化", focusDone: false },
      { name: "YouTube", kpi: 45, target: 50, focus: "ショート毎日投稿", focusDone: true },
      { name: "note", kpi: 7, target: 8, focus: "事例記事に集中", focusDone: true }
    ], achieved: false, assets: { followers: 7200, contents: 280, lineList: 430 } },
  ],
});

// ============================================
// LocalStorage Hook
// ============================================

const useLocalStorage = (key, init) => {
  const [val, setVal] = useState(() => {
    try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : init; }
    catch { return init; }
  });
  const set = (v) => {
    const x = typeof v === 'function' ? v(val) : v;
    setVal(x);
    localStorage.setItem(key, JSON.stringify(x));
  };
  return [val, set];
};

// ============================================
// AI Analysis Functions
// ============================================

const analyzeWeek = (state) => {
  const { channels, deals, currentMonth, assets, weeklyHistory } = state;
  
  // KPI分析
  const kpiAnalysis = channels.map(c => {
    const pct = c.kpiTarget > 0 ? Math.round((c.kpiCurrent / c.kpiTarget) * 100) : 0;
    const achieved = pct >= 80;
    const consecutiveMiss = c.consecutiveMiss || 0;
    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      current: c.kpiCurrent,
      target: c.kpiTarget,
      pct,
      achieved,
      consecutiveMiss: achieved ? 0 : consecutiveMiss + 1,
      trend: pct >= 100 ? 'up' : pct >= 80 ? 'stable' : 'down'
    };
  });

  // 売上分析
  const monthlyDeals = deals.filter(d => isThisMonth(d.date, currentMonth));
  const weeklyDeals = monthlyDeals.slice(-2); // 直近の成約
  const monthlyTotal = monthlyDeals.reduce((s, d) => s + d.amount, 0);
  const channelDeals = {};
  monthlyDeals.forEach(d => {
    channelDeals[d.channel] = (channelDeals[d.channel] || 0) + 1;
  });

  // 資産差分
  const lastWeekAssets = weeklyHistory[0]?.assets || assets;
  const assetsDiff = {
    followers: assets.followers - (lastWeekAssets.followers || 0),
    contents: assets.contents - (lastWeekAssets.contents || 0),
    lineList: assets.lineList - (lastWeekAssets.lineList || 0),
  };

  // 傾向分析
  const insights = [];
  
  kpiAnalysis.forEach(k => {
    if (k.consecutiveMiss >= 3) {
      insights.push({ type: 'warning', channel: k.name, message: `${k.consecutiveMiss}週連続未達` });
    }
  });

  const topChannel = Object.entries(channelDeals).sort((a, b) => b[1] - a[1])[0];
  if (topChannel && topChannel[1] >= 2) {
    insights.push({ type: 'success', channel: topChannel[0], message: `成約${topChannel[1]}件で好調` });
  }

  channels.forEach(c => {
    const hasDeals = channelDeals[c.name] > 0;
    const k = kpiAnalysis.find(x => x.id === c.id);
    if (k && k.achieved && !hasDeals) {
      insights.push({ type: 'info', channel: c.name, message: 'KPI達成も成約なし' });
    }
  });

  return {
    kpiAnalysis,
    sales: { monthlyTotal, weeklyDeals, channelDeals },
    assetsDiff,
    insights
  };
};

const generateProposal = (state, analysis, answers) => {
  const { channels } = state;
  const { kpiAnalysis, sales, insights } = analysis;
  const { workload, reasons } = answers;

  const workloadMultiplier = 
    workload === 'busy' ? 0.7 :
    workload === 'very_busy' ? 0.5 :
    workload === 'extra' ? 1.2 : 1.0;

  // 方針生成
  let focusChannel = null;
  let focusReason = '';
  
  const bestChannel = Object.entries(sales.channelDeals).sort((a, b) => b[1] - a[1])[0];
  if (bestChannel) {
    focusChannel = bestChannel[0];
    focusReason = `成約に直結してる`;
  }

  // KPI提案
  const kpiProposals = channels.map(c => {
    const k = kpiAnalysis.find(x => x.id === c.id);
    const reason = reasons[c.id];
    let newTarget = c.kpiTarget;
    let change = '';
    let changeReason = '';

    // 未達続きで理由が「時間」の場合
    if (k.consecutiveMiss >= 2 && reason === 'no_time') {
      newTarget = Math.round(c.kpiTarget * 0.7);
      change = 'down';
      changeReason = '時間ないなら現実的な数字に';
    }
    // 未達続きで理由が「反応薄い」
    else if (k.consecutiveMiss >= 2 && reason === 'low_response') {
      newTarget = Math.round(c.kpiTarget * 0.8);
      change = 'down';
      changeReason = '方針見直しも検討';
    }
    // 好調チャネル
    else if (k.achieved && sales.channelDeals[c.name] > 0) {
      newTarget = Math.round(c.kpiTarget * 1.1);
      change = 'up';
      changeReason = '売上に繋がってるから強化';
    }
    // 稼働に応じた調整
    else if (workloadMultiplier !== 1.0) {
      newTarget = Math.round(c.kpiTarget * workloadMultiplier);
      change = workloadMultiplier < 1 ? 'down' : 'up';
      changeReason = workloadMultiplier < 1 ? '稼働少なめに合わせて' : '余裕あるなら伸ばす';
    }

    // フォーカスチャネルは維持
    if (c.name === focusChannel && change === 'down') {
      newTarget = c.kpiTarget;
      change = '';
      changeReason = '最優先なので維持';
    }

    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      currentTarget: c.kpiTarget,
      newTarget,
      change,
      changeReason,
      isFocus: c.name === focusChannel
    };
  });

  // タスク提案
  const taskProposals = channels.map(c => {
    const proposal = kpiProposals.find(p => p.id === c.id);
    const tasks = [];

    // 継続タスク
    c.tasks.continuous.forEach(t => {
      const ratio = proposal.newTarget / proposal.currentTarget;
      tasks.push({
        type: 'continuous',
        title: t.title,
        target: Math.round(t.target * ratio),
        unit: t.unit,
        isNew: false
      });
    });

    // 未完了の単発タスク
    c.tasks.once.filter(t => !t.done).forEach(t => {
      tasks.push({
        type: 'once',
        title: t.title,
        isNew: false,
        note: '持ち越し'
      });
    });

    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      tasks
    };
  });

  return {
    focus: focusChannel,
    focusReason,
    strategy: workload === 'busy' || workload === 'very_busy' 
      ? `${focusChannel || channels[0]?.name}に集中。他は最低限に。`
      : '各チャネルバランスよく進める',
    kpiProposals,
    taskProposals
  };
};

// ============================================
// Phase Progress Card
// ============================================

const PhaseProgressCard = ({ state, onEdit }) => {
  const { yearlyGoal, phases, currentPhaseId } = state;
  const currentPhase = phases.find(p => p.id === currentPhaseId);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-violet-500" />
          <span className="font-semibold text-slate-800">{yearlyGoal.title || '目標未設定'}</span>
        </div>
        <button onClick={onEdit} className="text-slate-400 hover:text-violet-600"><Edit3 size={14} /></button>
      </div>

      {phases.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            {phases.map((phase, i) => (
              <div key={phase.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    phase.completed ? 'bg-emerald-500 text-white' :
                    phase.id === currentPhaseId ? 'bg-violet-500 text-white ring-4 ring-violet-100' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {phase.completed ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${phase.id === currentPhaseId ? 'text-violet-600' : 'text-slate-500'}`}>{phase.name}</span>
                  <span className="text-xs text-slate-400">{phase.period}</span>
                </div>
                {i < phases.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${phase.completed ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPhase && (
        <div className="bg-violet-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-violet-500" />
            <span className="text-sm font-medium text-violet-700">現在地: {currentPhase.name}</span>
          </div>
          <p className="text-sm text-violet-600">{currentPhase.description}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Revenue Card
// ============================================

const RevenueCard = ({ state, onEditPipeline }) => {
  const { goal, deals, pipeline, currentMonth } = state;
  const monthlyDeals = deals.filter(d => isThisMonth(d.date, currentMonth));
  const current = monthlyDeals.reduce((s, d) => s + d.amount, 0);
  const pct = goal.targetRevenue > 0 ? Math.round((current / goal.targetRevenue) * 100) : 0;
  const achieved = pct >= 100;
  const remaining = goal.unitPrice > 0 ? Math.max(0, Math.ceil((goal.targetRevenue - current) / goal.unitPrice)) : 0;

  return (
    <div className={`rounded-lg p-5 ${achieved ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs opacity-70 mb-1">{currentMonth}月売上</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{current}</span>
            <span className="opacity-60 text-sm">/ {goal.targetRevenue}万</span>
          </div>
        </div>
        <div className="text-2xl font-bold">{pct}%</div>
      </div>
      
      <div className="h-2 bg-white/20 rounded-full mb-3">
        <div className={`h-full rounded-full ${achieved ? 'bg-white' : 'bg-violet-400'}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      
      <div className="flex justify-between text-xs opacity-80 mb-4">
        <span>{monthlyDeals.length}件 × @{goal.unitPrice}万</span>
        <span>{achieved ? '達成!' : `残り${remaining}件`}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20">
        <button onClick={() => onEditPipeline('leads')} className="text-center p-2 rounded-md hover:bg-white/10">
          <Inbox size={14} className="mx-auto mb-1 opacity-70" />
          <div className="text-lg font-bold">{pipeline.leads}</div>
          <div className="text-xs opacity-60">リード</div>
        </button>
        <button onClick={() => onEditPipeline('meetings')} className="text-center p-2 rounded-md hover:bg-white/10">
          <MessageSquare size={14} className="mx-auto mb-1 opacity-70" />
          <div className="text-lg font-bold">{pipeline.meetings}</div>
          <div className="text-xs opacity-60">商談</div>
        </button>
        <div className="text-center p-2">
          <CheckCircle2 size={14} className="mx-auto mb-1 opacity-70" />
          <div className="text-lg font-bold">{monthlyDeals.length}</div>
          <div className="text-xs opacity-60">成約</div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Assets Card
// ============================================

const AssetsCard = ({ assets, onEdit }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Package size={15} className="text-slate-400" />
        <span className="font-medium text-slate-800 text-sm">積み上げ資産</span>
      </div>
      <button onClick={onEdit} className="text-slate-400 hover:text-violet-600"><Edit3 size={12} /></button>
    </div>
    <div className="space-y-3">
      {[
        { icon: Users, label: 'フォロワー', value: assets.followers, bg: 'bg-violet-50', color: 'text-violet-500' },
        { icon: FileText, label: 'コンテンツ', value: assets.contents, bg: 'bg-blue-50', color: 'text-blue-500' },
        { icon: MessageSquare, label: 'LINE登録', value: assets.lineList, bg: 'bg-emerald-50', color: 'text-emerald-500' },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${item.bg} rounded-md flex items-center justify-center`}>
              <item.icon size={14} className={item.color} />
            </div>
            <span className="text-sm text-slate-600">{item.label}</span>
          </div>
          <div className="font-bold text-slate-800">{item.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// Channel Card
// ============================================

const ChannelCard = ({ channel, onUpdate, onEdit, onAddTask, onDelete, onTaskComplete }) => {
  const pct = channel.kpiTarget > 0 ? Math.round((channel.kpiCurrent / channel.kpiTarget) * 100) : 0;
  const kpiDone = pct >= 100;

  const toggle = (id, was) => {
    onUpdate({ ...channel, tasks: { ...channel.tasks, once: channel.tasks.once.map(t => t.id === id ? { ...t, done: !t.done } : t) } });
    if (!was) onTaskComplete();
  };

  const updateCont = (id, v, was) => {
    const t = channel.tasks.continuous.find(x => x.id === id);
    const now = v >= t.target;
    onUpdate({ ...channel, tasks: { ...channel.tasks, continuous: channel.tasks.continuous.map(x => x.id === id ? { ...x, current: Math.max(0, v) } : x) } });
    if (!was && now) onTaskComplete();
  };

  const updateKpi = (v) => onUpdate({ ...channel, kpiCurrent: Math.max(0, v) });
  const addBacklog = (item) => onUpdate({ ...channel, tasks: { ...channel.tasks, once: [...channel.tasks.once, { id: `t${Date.now()}`, title: item, done: false }] }, backlog: channel.backlog.filter(b => b !== item) });
  const deleteTask = (id, type) => onUpdate({ ...channel, tasks: { ...channel.tasks, [type]: channel.tasks[type].filter(t => t.id !== id) } });

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className={`p-4 border-b border-slate-100 ${kpiDone ? 'bg-emerald-50' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{channel.icon}</span>
            <span className="font-medium text-slate-800 text-sm">{channel.name}</span>
            {kpiDone && <Star size={12} className="text-amber-500 fill-amber-500" />}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(channel)} className="text-slate-300 hover:text-violet-500"><Edit3 size={11} /></button>
            <button onClick={() => onDelete(channel.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={11} /></button>
          </div>
        </div>
        
        {channel.weeklyFocus && (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-violet-100 rounded-md">
            <Flag size={10} className="text-violet-500" />
            <span className="text-xs text-violet-700 font-medium">{channel.weeklyFocus}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">{channel.kpiName}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => updateKpi(channel.kpiCurrent - 1)} className="w-5 h-5 rounded bg-white border border-slate-200 text-xs flex items-center justify-center">−</button>
            <span className="font-bold text-slate-800 text-sm w-12 text-center">{channel.kpiCurrent}<span className="text-slate-400 font-normal text-xs">/{channel.kpiTarget}</span></span>
            <button onClick={() => updateKpi(channel.kpiCurrent + 1)} className="w-5 h-5 rounded bg-violet-500 text-white text-xs flex items-center justify-center">+</button>
          </div>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full">
          <div className={`h-full rounded-full ${kpiDone ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {channel.tasks.once.map(t => (
          <div key={t.id} className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer ${t.done ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
            <div onClick={() => toggle(t.id, t.done)} className="flex-1 flex items-center gap-2">
              {t.done ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-300" />}
              <span className={`text-sm ${t.done ? 'text-slate-400 line-through' : ''}`}>{t.title}</span>
            </div>
            <button onClick={() => deleteTask(t.id, 'once')} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><X size={12} /></button>
          </div>
        ))}

        {channel.tasks.continuous.map(t => {
          const p = (t.current / t.target) * 100;
          const done = t.current >= t.target;
          return (
            <div key={t.id} className={`group p-2 rounded-md ${done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-700 flex items-center gap-1">
                  <RefreshCw size={10} className="text-slate-400" />{t.title}
                  <span className="text-xs text-slate-400">({t.unit})</span>
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => deleteTask(t.id, 'continuous')} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 mr-1"><X size={10} /></button>
                  <button onClick={() => updateCont(t.id, t.current - 1, done)} className="w-5 h-5 rounded bg-white border border-slate-200 text-xs flex items-center justify-center">−</button>
                  <span className={`text-xs font-medium w-10 text-center ${done ? 'text-emerald-600' : ''}`}>{t.current}/{t.target}</span>
                  <button onClick={() => updateCont(t.id, t.current + 1, done)} className={`w-5 h-5 rounded text-white text-xs flex items-center justify-center ${done ? 'bg-emerald-500' : 'bg-violet-500'}`}>+</button>
                </div>
              </div>
              <div className="h-1 bg-slate-200 rounded-full">
                <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${Math.min(100, p)}%` }} />
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-slate-100">
          <button onClick={() => onAddTask(channel)} className="w-full py-1.5 text-xs text-violet-600 hover:bg-violet-50 rounded-md flex items-center justify-center gap-1">
            <Plus size={11} />タスク追加
          </button>
          {channel.backlog.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {channel.backlog.map((b, i) => (
                <button key={i} onClick={() => addBacklog(b)} className="text-xs px-1.5 py-0.5 bg-slate-100 hover:bg-violet-100 rounded">+{b}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Weekly Cycle Modal (v25 - AI主導)
// ============================================


// ============================================
// Onboarding
// ============================================

const Onboarding = ({ onComplete, onDemo }) => {
  const [step, setStep] = useState(0);
  const [yearlyGoal, setYearlyGoal] = useState({ title: '', targetRevenue: '', year: new Date().getFullYear(), why: '' });
  const [phases, setPhases] = useState([{ name: '', period: '', targetRevenue: '', description: '' }]);
  const [goal, setGoal] = useState({ title: '', targetRevenue: '', unitPrice: '' });
  const [channels, setChannels] = useState([{ name: '', icon: '', kpiName: '', kpiTarget: '' }]);

  const addPhase = () => setPhases([...phases, { name: '', period: '', targetRevenue: '', description: '' }]);
  const updatePhase = (i, field, value) => { const newP = [...phases]; newP[i][field] = value; setPhases(newP); };
  const removePhase = (i) => setPhases(phases.filter((_, idx) => idx !== i));
  const addChannel = () => setChannels([...channels, { name: '', icon: '', kpiName: '', kpiTarget: '' }]);
  const updateChannel = (i, field, value) => { const newCh = [...channels]; newCh[i][field] = value; setChannels(newCh); };
  const removeChannel = (i) => setChannels(channels.filter((_, idx) => idx !== i));

  const canProceed = () => {
    if (step === 0) return yearlyGoal.title && yearlyGoal.targetRevenue;
    if (step === 1) return phases.some(p => p.name && p.targetRevenue);
    if (step === 2) return goal.title && goal.targetRevenue && goal.unitPrice;
    if (step === 3) return channels.some(c => c.name && c.kpiName && c.kpiTarget);
    return true;
  };

  const finish = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const weekStart = `${month}/${Math.max(1, now.getDate() - now.getDay())}`;
    const validPhases = phases.filter(p => p.name && p.targetRevenue).map((p, i) => ({ id: i + 1, ...p, targetRevenue: Number(p.targetRevenue), completed: false }));
    const validChannels = channels.filter(c => c.name && c.kpiName && c.kpiTarget).map((c, i) => ({
      id: i + 1, name: c.name, icon: c.icon || c.name[0], kpiName: c.kpiName, kpiTarget: Number(c.kpiTarget), kpiCurrent: 0,
      weeklyFocus: '', consecutiveMiss: 0,
      tasks: { once: [], continuous: [] }, backlog: []
    }));

    onComplete({
      isOnboarded: true,
      yearlyGoal: { ...yearlyGoal, targetRevenue: Number(yearlyGoal.targetRevenue) },
      phases: validPhases, currentPhaseId: validPhases[0]?.id || null,
      goal: { title: goal.title, targetRevenue: Number(goal.targetRevenue), unitPrice: Number(goal.unitPrice) },
      currentMonth: String(month), currentWeekStart: weekStart, weekNumber: 1,
      streak: 0, level: 1, exp: 0, maxExp: 100, totalTasksCompleted: 0,
      deals: [], pipeline: { leads: 0, meetings: 0 }, assets: { followers: 0, contents: 0, lineList: 0 },
      channels: validChannels, weeklyHistory: [],
    });
  };

  const stepTitles = ['大目標', 'フェーズ設計', '今期の目標', 'チャネル設定'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="bg-violet-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><Layers size={20} /></div>
            <span className="text-xl font-bold">CycleOS</span>
          </div>
          <p className="text-violet-200 text-sm">週次サイクルで目標達成をサポート</p>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-1">{[0, 1, 2, 3].map(i => <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-violet-500' : 'bg-slate-200'}`} />)}</div>
          <p className="text-xs text-slate-500 mt-2">Step {step + 1}: {stepTitles[step]}</p>
        </div>

        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-semibold text-slate-800 mb-1">大目標を設定</h2><p className="text-sm text-slate-500">今年達成したいゴール</p></div>
              <input value={yearlyGoal.title} onChange={e => setYearlyGoal({ ...yearlyGoal, title: e.target.value })} placeholder="目標（例：LINE構築で年商3000万）" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
              <input type="number" value={yearlyGoal.targetRevenue} onChange={e => setYearlyGoal({ ...yearlyGoal, targetRevenue: e.target.value })} placeholder="年間目標（万円）" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
              <div>
                <label className="text-xs text-slate-500 mb-1 block">なぜこれを達成したい？（任意）</label>
                <input value={yearlyGoal.why} onChange={e => setYearlyGoal({ ...yearlyGoal, why: e.target.value })} placeholder="例：独立して家族との時間を確保したい" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-semibold text-slate-800 mb-1">フェーズを設計</h2><p className="text-sm text-slate-500">大目標を分割</p></div>
              <div className="space-y-3 max-h-52 overflow-y-auto">
                {phases.map((p, i) => (
                  <div key={i} className="p-3 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <input value={p.name} onChange={e => updatePhase(i, 'name', e.target.value)} placeholder={`Phase ${i + 1}`} className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                      <input value={p.period} onChange={e => updatePhase(i, 'period', e.target.value)} placeholder="期間" className="w-20 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                      {phases.length > 1 && <button onClick={() => removePhase(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>}
                    </div>
                    <div className="flex gap-2">
                      <input type="number" value={p.targetRevenue} onChange={e => updatePhase(i, 'targetRevenue', e.target.value)} placeholder="目標（万）" className="w-24 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                      <input value={p.description} onChange={e => updatePhase(i, 'description', e.target.value)} placeholder="このフェーズの意味" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addPhase} className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500">+ フェーズを追加</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-semibold text-slate-800 mb-1">今期の目標</h2><p className="text-sm text-slate-500">今月のマイルストーン</p></div>
              <input value={goal.title} onChange={e => setGoal({ ...goal, title: e.target.value })} placeholder="月次目標" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={goal.targetRevenue} onChange={e => setGoal({ ...goal, targetRevenue: e.target.value })} placeholder="月間売上（万円）" className="px-4 py-3 border border-slate-200 rounded-lg" />
                <input type="number" value={goal.unitPrice} onChange={e => setGoal({ ...goal, unitPrice: e.target.value })} placeholder="案件単価（万円）" className="px-4 py-3 border border-slate-200 rounded-lg" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-semibold text-slate-800 mb-1">チャネルを設定</h2><p className="text-sm text-slate-500">集客チャネルと週間KPI</p></div>
              <div className="space-y-3 max-h-52 overflow-y-auto">
                {channels.map((ch, i) => (
                  <div key={i} className="p-3 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <input value={ch.name} onChange={e => updateChannel(i, 'name', e.target.value)} placeholder="チャネル名" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                      <input value={ch.icon} onChange={e => updateChannel(i, 'icon', e.target.value)} placeholder="icon" className="w-14 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                      {channels.length > 1 && <button onClick={() => removeChannel(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>}
                    </div>
                    <div className="flex gap-2">
                      <input value={ch.kpiName} onChange={e => updateChannel(i, 'kpiName', e.target.value)} placeholder="KPI名" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                      <input type="number" value={ch.kpiTarget} onChange={e => updateChannel(i, 'kpiTarget', e.target.value)} placeholder="週目標" className="w-20 px-3 py-2 border border-slate-200 rounded-md text-sm" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addChannel} className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500">+ チャネルを追加</button>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 space-y-3">
          <div className="flex gap-3">
            {step > 0 && <button onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-slate-200 rounded-lg text-slate-600">戻る</button>}
            {step < 3 ? (
              <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white rounded-lg font-medium flex items-center justify-center gap-1">次へ <ChevronRight size={16} /></button>
            ) : (
              <button onClick={finish} disabled={!canProceed()} className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white rounded-lg font-medium flex items-center justify-center gap-1"><Rocket size={16} /> 始める</button>
            )}
          </div>
          <button onClick={onDemo} className="w-full py-2 text-sm text-slate-400 hover:text-violet-600">デモデータで試す</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Sidebar
// ============================================

const Sidebar = ({ state, tab, setTab, onCycle, user, onSignOut }) => (
  <div className="w-52 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col">
    <div className="h-14 px-4 flex items-center gap-2 border-b border-slate-100">
      <div className="w-7 h-7 bg-violet-600 rounded-md flex items-center justify-center"><Layers size={14} className="text-white" /></div>
      <span className="font-bold text-slate-800 text-sm">CycleOS</span>
    </div>
    <div className="px-3 py-2 border-b border-slate-100">
      <div className="flex items-center gap-2 text-xs"><Bot size={14} className="text-violet-500" /><span className="text-slate-600">{pick(GREETINGS)}</span></div>
    </div>
    <div className="px-3 py-3 border-b border-slate-100 flex gap-2">
      <div className="flex-1 bg-amber-50 rounded-md px-2 py-1.5 text-center"><div className="text-xs font-bold text-amber-700">Lv.{state.level}</div></div>
      <div className="flex-1 bg-orange-50 rounded-md px-2 py-1.5 flex items-center justify-center gap-1">
        <Flame size={12} className="text-orange-500" />
        <span className="text-xs font-bold text-orange-700">{state.streak}週</span>
      </div>
    </div>
    <nav className="flex-1 p-2 space-y-0.5">
      {[{ id: 'dashboard', icon: LayoutDashboard, label: 'ダッシュボード' }, { id: 'analytics', icon: TrendingUp, label: '分析' }, { id: 'deals', icon: DollarSign, label: '売上管理' }, { id: 'history', icon: History, label: '履歴' }, { id: 'settings', icon: Settings, label: '設定' }].map(item => {
        const Icon = item.icon;
        return <button key={item.id} onClick={() => setTab(item.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${tab === item.id ? 'bg-violet-100 text-violet-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={15} />{item.label}</button>;
      })}
    </nav>
    <div className="p-3 border-t border-slate-100">
      <button onClick={onCycle} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">
        <Sparkles size={14} />週次サイクル
      </button>
    </div>
    <div className="px-3 py-3 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-md" />
        ) : (
          <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-white text-xs font-bold">
            {user?.displayName?.[0] || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-700 truncate">{user?.displayName || 'User'}</div>
          <div className="text-xs text-slate-400">{state.totalTasksCompleted} tasks</div>
        </div>
      </div>
      <button 
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md"
      >
        <LogOut size={12} />ログアウト
      </button>
    </div>
  </div>
);

// ============================================
// Header
// ============================================

const Header = ({ title, week }) => (
  <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
    <h1 className="font-semibold text-slate-800 text-sm">{title}</h1>
    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">
      <Calendar size={11} />{week}週
    </div>
  </header>
);

// ============================================
// Modals
// ============================================

const Modal = ({ title, children, onClose, size = 'sm' }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className={`bg-white rounded-lg w-full shadow-xl ${size === 'md' ? 'max-w-md' : 'max-w-sm'}`} onClick={e => e.stopPropagation()}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-sm">{title}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

const GoalEditModal = ({ state, onClose, onSave }) => {
  const [yTitle, setYTitle] = useState(state.yearlyGoal.title);
  const [yRev, setYRev] = useState(state.yearlyGoal.targetRevenue.toString());
  const [yWhy, setYWhy] = useState(state.yearlyGoal.why || '');
  const [phases, setPhases] = useState(state.phases.map(p => ({ ...p, targetRevenue: p.targetRevenue.toString() })));
  const [currentPhaseId, setCurrentPhaseId] = useState(state.currentPhaseId);
  const [title, setTitle] = useState(state.goal.title);
  const [rev, setRev] = useState(state.goal.targetRevenue.toString());
  const [price, setPrice] = useState(state.goal.unitPrice.toString());
  const updatePhase = (i, field, value) => { const newP = [...phases]; newP[i][field] = value; setPhases(newP); };

  return (
    <Modal title="目標を編集" onClose={onClose} size="md">
      <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
        <div>
          <div className="text-xs font-medium text-slate-500 mb-2">大目標</div>
          <input value={yTitle} onChange={e => setYTitle(e.target.value)} placeholder="年間目標" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm mb-2" />
          <input type="number" value={yRev} onChange={e => setYRev(e.target.value)} placeholder="年間売上（万円）" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm mb-2" />
          <input value={yWhy} onChange={e => setYWhy(e.target.value)} placeholder="なぜ？（任意）" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-500" />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 mb-2">フェーズ</div>
          {phases.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 mb-2">
              <input type="radio" checked={currentPhaseId === p.id} onChange={() => setCurrentPhaseId(p.id)} />
              <input value={p.name} onChange={e => updatePhase(i, 'name', e.target.value)} className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm" />
              <input value={p.targetRevenue} onChange={e => updatePhase(i, 'targetRevenue', e.target.value)} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm" placeholder="万" />
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 mb-2">今期の目標</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="月次目標" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm mb-2" />
          <div className="flex gap-2">
            <input type="number" value={rev} onChange={e => setRev(e.target.value)} placeholder="月間売上" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="単価" className="w-24 px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { onSave({ yearlyGoal: { ...state.yearlyGoal, title: yTitle, targetRevenue: Number(yRev), why: yWhy }, phases: phases.map(p => ({ ...p, targetRevenue: Number(p.targetRevenue) })), currentPhaseId, goal: { title, targetRevenue: Number(rev), unitPrice: Number(price) } }); onClose(); }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">保存</button>
      </div>
    </Modal>
  );
};

const DealModal = ({ state, onClose, onSave }) => {
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState(state.goal.unitPrice.toString());
  const [channel, setChannel] = useState(state.channels[0]?.name || '');
  const [fromPipeline, setFromPipeline] = useState(true);

  return (
    <Modal title="成約を記録" onClose={onClose}>
      <div className="p-4 space-y-3">
        <input value={client} onChange={e => setClient(e.target.value)} placeholder="クライアント名" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="金額（万円）" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
        <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm">
          {state.channels.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          <option value="紹介">紹介</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={fromPipeline} onChange={e => setFromPipeline(e.target.checked)} />
          商談から成約
        </label>
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { if (client) { onSave({ client, amount: Number(amount), channel, date: state.currentWeekStart }, fromPipeline); onClose(); } }} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium">記録</button>
      </div>
    </Modal>
  );
};

const TaskAddModal = ({ channel, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('once');
  const [target, setTarget] = useState('7');
  const [unit, setUnit] = useState('回');

  return (
    <Modal title={`${channel.name}にタスク追加`} onClose={onClose}>
      <div className="p-4 space-y-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="タスク名" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
        <div className="flex gap-2">
          <button onClick={() => setType('once')} className={`flex-1 py-2 rounded-md text-sm ${type === 'once' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100'}`}>単発</button>
          <button onClick={() => setType('continuous')} className={`flex-1 py-2 rounded-md text-sm ${type === 'continuous' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100'}`}>継続</button>
        </div>
        {type === 'continuous' && (
          <div className="flex gap-2">
            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="目標" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="単位" className="w-20 px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { if (title) { onSave({ channelId: channel.id, type, task: type === 'once' ? { id: `t${Date.now()}`, title, done: false } : { id: `c${Date.now()}`, title, target: Number(target), current: 0, unit } }); onClose(); } }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">追加</button>
      </div>
    </Modal>
  );
};

const AssetsEditModal = ({ assets, onClose, onSave }) => {
  const [f, setF] = useState(assets.followers.toString());
  const [c, setC] = useState(assets.contents.toString());
  const [l, setL] = useState(assets.lineList.toString());

  return (
    <Modal title="資産を編集" onClose={onClose}>
      <div className="p-4 space-y-3">
        {[{ label: 'フォロワー', val: f, set: setF }, { label: 'コンテンツ', val: c, set: setC }, { label: 'LINE登録', val: l, set: setL }].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-sm w-24">{item.label}</span>
            <input type="number" value={item.val} onChange={e => item.set(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { onSave({ followers: Number(f), contents: Number(c), lineList: Number(l) }); onClose(); }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">保存</button>
      </div>
    </Modal>
  );
};

const PipelineEditModal = ({ type, value, onClose, onSave }) => {
  const [v, setV] = useState(value.toString());
  return (
    <Modal title={`${type === 'leads' ? 'リード' : '商談'}数`} onClose={onClose}>
      <div className="p-4">
        <input type="number" value={v} onChange={e => setV(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { onSave(type, Number(v)); onClose(); }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">保存</button>
      </div>
    </Modal>
  );
};

const ChannelEditModal = ({ channel, onClose, onSave }) => {
  const [name, setName] = useState(channel.name);
  const [icon, setIcon] = useState(channel.icon);
  const [kpiName, setKpiName] = useState(channel.kpiName);
  const [kpiTarget, setKpiTarget] = useState(channel.kpiTarget.toString());

  return (
    <Modal title="チャネルを編集" onClose={onClose}>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
          <input value={icon} onChange={e => setIcon(e.target.value)} className="w-16 px-3 py-2 border border-slate-200 rounded-md text-sm" />
        </div>
        <input value={kpiName} onChange={e => setKpiName(e.target.value)} placeholder="KPI名" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
        <input type="number" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} placeholder="週間KPI目標" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { onSave({ ...channel, name, icon, kpiName, kpiTarget: Number(kpiTarget) }); onClose(); }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">保存</button>
      </div>
    </Modal>
  );
};

const AddChannelModal = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [kpiName, setKpiName] = useState('');
  const [kpiTarget, setKpiTarget] = useState('10');

  return (
    <Modal title="チャネルを追加" onClose={onClose}>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="チャネル名" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" />
          <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="icon" className="w-16 px-3 py-2 border border-slate-200 rounded-md text-sm" />
        </div>
        <input value={kpiName} onChange={e => setKpiName(e.target.value)} placeholder="KPI名" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
        <input type="number" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} placeholder="週間KPI目標" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { if (name && kpiName) { onSave({ id: Date.now(), name, icon: icon || name[0], kpiName, kpiTarget: Number(kpiTarget), kpiCurrent: 0, weeklyFocus: '', consecutiveMiss: 0, tasks: { once: [], continuous: [] }, backlog: [] }); onClose(); } }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">追加</button>
      </div>
    </Modal>
  );
};

const ImportModal = ({ onClose, onImport }) => {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  return (
    <Modal title="データをインポート" onClose={onClose}>
      <div className="p-4 space-y-3">
        <textarea value={json} onChange={e => { setJson(e.target.value); setError(''); }} placeholder="JSONを貼り付け..." className="w-full h-40 px-3 py-2 border border-slate-200 rounded-md text-xs font-mono resize-none" />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm">キャンセル</button>
        <button onClick={() => { try { const data = JSON.parse(json); data.isOnboarded = true; onImport(data); onClose(); } catch { setError('JSONの形式が正しくありません'); } }} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium">インポート</button>
      </div>
    </Modal>
  );
};

// ============================================
// Pages
// ============================================

const DealsPage = ({ state, onAdd }) => {
  const monthlyDeals = state.deals.filter(d => isThisMonth(d.date, state.currentMonth));
  const total = monthlyDeals.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-sm">{state.currentMonth}月の売上</h2>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"><Plus size={13} />記録</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">今月売上</div>
          <div className="text-2xl font-bold text-slate-800">{total}<span className="text-sm text-slate-400 ml-1">万</span></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">成約数</div>
          <div className="text-2xl font-bold text-slate-800">{monthlyDeals.length}<span className="text-sm text-slate-400 ml-1">件</span></div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {monthlyDeals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">まだ成約がありません</div>
        ) : (
          monthlyDeals.map(d => (
            <div key={d.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 text-sm">{d.client}</div>
                <div className="text-xs text-slate-500">{d.date} / {d.channel}</div>
              </div>
              <div className="font-bold text-emerald-600">+{d.amount}万</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const HistoryPage = ({ state }) => (
  <div className="space-y-5">
    <h2 className="font-semibold text-slate-800 text-sm">履歴</h2>
    {state.weeklyHistory.length === 0 ? (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-sm">まだ履歴がありません</div>
    ) : (
      <div className="space-y-4">
        {state.weeklyHistory.map((w, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-slate-800">{w.week}</span>
              {w.achieved ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><Check size={12} />達成</span>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">未達成</span>
              )}
            </div>
            <div className="space-y-2">
              {w.channels?.map((c, j) => (
                <div key={j} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">{c.name}</span>
                    {c.focus && <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{c.focus}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800">{c.kpi}/{c.target}</span>
                    {c.focusDone === true && <Check size={12} className="text-emerald-500" />}
                    {c.focusDone === false && <X size={12} className="text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const SettingsPage = ({ state, onEditGoal, onReset, onExport, onImport }) => (
  <div className="space-y-5">
    <h2 className="font-semibold text-slate-800 text-sm">設定</h2>
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">目標設定</span>
        <button onClick={onEditGoal} className="text-xs text-violet-600">編集</button>
      </div>
      <div className="text-sm space-y-2">
        <div className="flex justify-between"><span className="text-slate-500">大目標</span><span className="text-slate-800">{state.yearlyGoal.title || '未設定'}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">年間売上</span><span className="text-slate-800">{state.yearlyGoal.targetRevenue}万</span></div>
        <div className="border-t border-slate-100 pt-2 mt-2"></div>
        <div className="flex justify-between"><span className="text-slate-500">今期目標</span><span className="text-slate-800">{state.goal.title || '未設定'}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-xs text-slate-500 mb-3">ステータス</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-amber-50 rounded-md"><div className="font-bold">Lv.{state.level}</div><div className="text-xs text-slate-500">レベル</div></div>
        <div className="p-2 bg-orange-50 rounded-md"><div className="font-bold">{state.streak}週</div><div className="text-xs text-slate-500">連続</div></div>
        <div className="p-2 bg-violet-50 rounded-md"><div className="font-bold">{state.totalTasksCompleted}</div><div className="text-xs text-slate-500">完了</div></div>
      </div>
    </div>
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <div className="text-xs text-slate-500">データ管理</div>
      <div className="flex gap-2">
        <button onClick={onExport} className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50"><Download size={13} />エクスポート</button>
        <button onClick={onImport} className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50"><Upload size={13} />インポート</button>
      </div>
      <button onClick={onReset} className="text-xs text-red-500 hover:underline">データをリセット</button>
    </div>
  </div>
);

// ============================================
// Main App
// ============================================

export default function CycleOS() {
  const { user, signOut } = useAuth();
  const [state, setState, { loading: firestoreLoading }] = useFirestore(createInitialState());
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, icon, type = 'success') => setToast({ message: msg, icon, type });
  const boom = () => { setConfetti(true); setTimeout(() => setConfetti(false), 2500); };

  // Firestoreロード中
  if (firestoreLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!state.isOnboarded) return <Onboarding onComplete={setState} onDemo={() => setState(createDemoState())} />;

  const taskDone = () => { showToast(pick(TASK_DONE_MSG), Sparkles); setState(p => ({ ...p, totalTasksCompleted: p.totalTasksCompleted + 1, exp: p.exp + 10 })); };
  const updateChannel = (u) => setState(p => ({ ...p, channels: p.channels.map(c => c.id === u.id ? u : c) }));
  const deleteChannel = (id) => { if (state.channels.length <= 1) { showToast('最低1つ必要', AlertCircle, 'error'); return; } if (confirm('削除？')) setState(p => ({ ...p, channels: p.channels.filter(c => c.id !== id) })); };
  const addChannel = (ch) => setState(p => ({ ...p, channels: [...p.channels, ch] }));
  const addDeal = (d, fromPipeline) => { setState(p => ({ ...p, deals: [...p.deals, { ...d, id: Date.now() }], pipeline: fromPipeline ? { leads: Math.max(0, p.pipeline.leads - 1), meetings: Math.max(0, p.pipeline.meetings - 1) } : p.pipeline })); boom(); showToast('成約おめでとう', Trophy); };
  const addTask = ({ channelId, type, task }) => setState(p => ({ ...p, channels: p.channels.map(c => c.id === channelId ? { ...c, tasks: { ...c.tasks, [type]: [...c.tasks[type], task] } } : c) }));

  const handleCycleComplete = ({ historyEntry, newChannels, nextWeek, achieved, newAssets }) => {
    setState(p => ({
      ...p,
      currentWeekStart: nextWeek,
      weekNumber: p.weekNumber + 1,
      weeklyHistory: [historyEntry, ...p.weeklyHistory],
      streak: achieved ? p.streak + 1 : 0,
      exp: p.exp + (achieved ? 100 : 50),
      level: p.exp + (achieved ? 100 : 50) >= p.maxExp ? p.level + 1 : p.level,
      assets: newAssets,
      channels: newChannels,
    }));
    if (achieved) { boom(); showToast(pick(WEEK_DONE_MSG), Award); }
    setModal(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cycleos-${state.currentWeekStart.replace('/', '-')}.json`; a.click();
    showToast('エクスポート完了', Download);
  };

  const content = () => {
    switch (tab) {
      case 'analytics': return <AnalyticsPage state={state} />;
      case 'deals': return <DealsPage state={state} onAdd={() => setModal('deal')} />;
      case 'history': return <HistoryPage state={state} />;
      case 'settings': return <SettingsPage state={state} onEditGoal={() => setModal('goal')} onReset={() => { if (confirm('リセット？')) setState(createInitialState()); }} onExport={handleExport} onImport={() => setModal('import')} />;
      default:
        return (
          <div className="space-y-5">
            <PhaseProgressCard state={state} onEdit={() => setModal('goal')} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RevenueCard state={state} onEditPipeline={(type) => setModal({ type: 'pipeline', pipelineType: type })} />
              <AssetsCard assets={state.assets} onEdit={() => setModal('assets')} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Target size={14} className="text-slate-400" /><span className="font-medium text-slate-800 text-sm">今週のミッション</span></div>
                <button onClick={() => setModal('addChannel')} className="flex items-center gap-1 text-xs text-violet-600"><Plus size={12} />チャネル追加</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.channels.map(c => (<ChannelCard key={c.id} channel={c} onUpdate={updateChannel} onEdit={(ch) => setModal({ type: 'editChannel', channel: ch })} onAddTask={(ch) => setModal({ type: 'task', channel: ch })} onDelete={deleteChannel} onTaskComplete={taskDone} />))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Confetti active={confetti} />
      {toast && <Toast message={toast.message} icon={toast.icon} type={toast.type} onClose={() => setToast(null)} />}
      <Sidebar state={state} tab={tab} setTab={setTab} onCycle={() => setModal('cycle')} user={user} onSignOut={signOut} />
      <div className="ml-52">
        <Header title={tab === 'dashboard' ? 'ダッシュボード' : tab === 'analytics' ? '分析' : tab === 'deals' ? '売上管理' : tab === 'history' ? '履歴' : '設定'} week={state.currentWeekStart} />
        <main className="p-6">{content()}</main>
      </div>

      {modal === 'cycle' && <WeeklyCycleModal state={state} onClose={() => setModal(null)} onComplete={handleCycleComplete} />}
      {modal === 'deal' && <DealModal state={state} onClose={() => setModal(null)} onSave={addDeal} />}
      {modal === 'goal' && <GoalEditModal state={state} onClose={() => setModal(null)} onSave={({ yearlyGoal, phases, currentPhaseId, goal }) => setState(p => ({ ...p, yearlyGoal, phases, currentPhaseId, goal }))} />}
      {modal === 'assets' && <AssetsEditModal assets={state.assets} onClose={() => setModal(null)} onSave={a => setState(p => ({ ...p, assets: a }))} />}
      {modal?.type === 'pipeline' && <PipelineEditModal type={modal.pipelineType} value={state.pipeline[modal.pipelineType]} onClose={() => setModal(null)} onSave={(t, v) => setState(p => ({ ...p, pipeline: { ...p.pipeline, [t]: v } }))} />}
      {modal?.type === 'task' && <TaskAddModal channel={modal.channel} onClose={() => setModal(null)} onSave={addTask} />}
      {modal?.type === 'editChannel' && <ChannelEditModal channel={modal.channel} onClose={() => setModal(null)} onSave={updateChannel} />}
      {modal === 'addChannel' && <AddChannelModal onClose={() => setModal(null)} onSave={addChannel} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onImport={(data) => { setState(data); showToast('インポート完了', Upload); }} />}
    </div>
  );
}
