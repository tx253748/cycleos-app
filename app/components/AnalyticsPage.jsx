'use client'

import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, Flame, Trophy, CheckCircle2, Calendar, Target,
  Users, FileText, MessageSquare
} from 'lucide-react';

// ============================================
// Analytics Page
// ============================================

export const AnalyticsPage = ({ state }) => {
  // 週次履歴からKPI推移データを作成
  const kpiData = [...(state.weeklyHistory || [])].reverse().map((week, i) => {
    const entry = { week: week.week || `Week ${i + 1}` };
    week.channels?.forEach(ch => {
      entry[ch.name] = ch.target > 0 ? Math.round((ch.kpi / ch.target) * 100) : 0;
    });
    return entry;
  });

  // 資産推移データ
  const assetData = [...(state.weeklyHistory || [])].reverse().map((week, i) => ({
    week: week.week || `Week ${i + 1}`,
    フォロワー: week.assets?.followers || 0,
    コンテンツ: week.assets?.contents || 0,
    LINE登録: week.assets?.lineList || 0,
  }));

  // 月別売上データ
  const salesByMonth = {};
  (state.deals || []).forEach(deal => {
    const [month] = deal.date.split('/');
    const monthKey = `${month}月`;
    salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + deal.amount;
  });
  const salesData = Object.entries(salesByMonth).map(([month, amount]) => ({
    month,
    売上: amount / 10000, // 万円単位
  }));

  // 統計情報
  const totalDeals = state.deals?.length || 0;
  const totalRevenue = (state.deals || []).reduce((sum, d) => sum + d.amount, 0);
  const totalWeeks = state.weeklyHistory?.length || 0;
  const achievedWeeks = state.weeklyHistory?.filter(w => w.achieved)?.length || 0;
  
  // 連続達成計算
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  [...(state.weeklyHistory || [])].forEach(week => {
    if (week.achieved) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });
  // 現在の連続（最新から遡る）
  for (let i = 0; i < (state.weeklyHistory || []).length; i++) {
    if (state.weeklyHistory[i].achieved) {
      currentStreak++;
    } else {
      break;
    }
  }

  // 資産の成長
  const firstAssets = state.weeklyHistory?.[state.weeklyHistory.length - 1]?.assets || state.assets;
  const currentAssets = state.assets;
  const assetGrowth = {
    followers: currentAssets.followers - (firstAssets.followers || 0),
    contents: currentAssets.contents - (firstAssets.contents || 0),
    lineList: currentAssets.lineList - (firstAssets.lineList || 0),
  };

  // チャネルの色
  const channelColors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Flame} 
          label="現在の連続達成" 
          value={`${currentStreak}週`}
          color="text-orange-500"
          bgColor="bg-orange-50"
        />
        <StatCard 
          icon={Trophy} 
          label="最長連続達成" 
          value={`${maxStreak}週`}
          color="text-amber-500"
          bgColor="bg-amber-50"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="累計タスク完了" 
          value={`${state.totalTasksCompleted || 0}個`}
          color="text-emerald-500"
          bgColor="bg-emerald-50"
        />
        <StatCard 
          icon={Calendar} 
          label="継続期間" 
          value={`${totalWeeks}週`}
          color="text-violet-500"
          bgColor="bg-violet-50"
        />
      </div>

      {/* KPI達成率推移 */}
      {kpiData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={16} className="text-violet-500" />
            KPI達成率の推移
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  stroke="#94a3b8" 
                  domain={[0, 120]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend />
                {state.channels.map((ch, i) => (
                  <Line
                    key={ch.id}
                    type="monotone"
                    dataKey={ch.name}
                    stroke={channelColors[i % channelColors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
                {/* 100%ライン */}
                <Line
                  type="monotone"
                  dataKey={() => 100}
                  stroke="#cbd5e1"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  name="目標"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 資産の成長 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 資産推移グラフ */}
        {assetData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              資産の推移
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={assetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="フォロワー" stackId="1" stroke="#8b5cf6" fill="#c4b5fd" />
                  <Area type="monotone" dataKey="コンテンツ" stackId="2" stroke="#10b981" fill="#6ee7b7" />
                  <Area type="monotone" dataKey="LINE登録" stackId="3" stroke="#f59e0b" fill="#fcd34d" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 資産サマリー */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">📦 資産の成長</h3>
          <div className="space-y-4">
            <AssetRow 
              icon={Users}
              label="フォロワー"
              current={currentAssets.followers}
              growth={assetGrowth.followers}
              color="text-violet-600"
            />
            <AssetRow 
              icon={FileText}
              label="コンテンツ"
              current={currentAssets.contents}
              growth={assetGrowth.contents}
              color="text-emerald-600"
            />
            <AssetRow 
              icon={MessageSquare}
              label="LINE登録"
              current={currentAssets.lineList}
              growth={assetGrowth.lineList}
              color="text-amber-600"
            />
          </div>
        </div>
      </div>

      {/* 売上推移 */}
      {salesData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            💰 売上推移
            <span className="text-xs font-normal text-slate-500 ml-2">
              累計: {(totalRevenue / 10000).toFixed(1)}万円 / {totalDeals}件
            </span>
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${v}万`}
                />
                <Tooltip 
                  formatter={(value) => [`${value}万円`, '売上']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="売上" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 達成率サマリー */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">📈 達成サマリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-800">{totalWeeks}</div>
            <div className="text-xs text-slate-500">総週数</div>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{achievedWeeks}</div>
            <div className="text-xs text-slate-500">達成週</div>
          </div>
          <div className="text-center p-3 bg-violet-50 rounded-lg">
            <div className="text-2xl font-bold text-violet-600">
              {totalWeeks > 0 ? Math.round((achievedWeeks / totalWeeks) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-500">達成率</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">Lv.{state.level}</div>
            <div className="text-xs text-slate-500">現在レベル</div>
          </div>
        </div>
      </div>

      {/* データがない場合 */}
      {kpiData.length === 0 && (
        <div className="bg-slate-50 rounded-xl p-8 text-center">
          <div className="text-slate-400 mb-2">📊</div>
          <p className="text-slate-600 text-sm">まだデータがありません</p>
          <p className="text-slate-400 text-xs mt-1">週次サイクルを回すとグラフが表示されます</p>
        </div>
      )}
    </div>
  );
};

// 統計カード
const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-4`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} className={color} />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

// 資産行
const AssetRow = ({ icon: Icon, label, current, growth, color }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={16} className={color} />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-slate-800">{current.toLocaleString()}</span>
      {growth !== 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded ${growth > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {growth > 0 ? '+' : ''}{growth.toLocaleString()}
        </span>
      )}
    </div>
  </div>
);

export default AnalyticsPage;
