'use client'

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Sparkles, X, ChevronRight, ChevronLeft, Rocket, Send,
  Check, AlertTriangle, TrendingUp, TrendingDown, Circle,
  Coffee, Minus, MessageSquare, Zap, Loader2
} from 'lucide-react';

// ============================================
// Weekly Cycle Modal (AI統合版)
// ============================================

export const WeeklyCycleModal = ({ state, onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI分析結果
  const [analysis, setAnalysis] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // ユーザー回答
  const [answers, setAnswers] = useState({ workload: 'normal', reasons: {}, note: '' });
  
  // AI提案
  const [proposal, setProposal] = useState(null);
  const [editedProposal, setEditedProposal] = useState(null);
  
  // 相談モード
  const [chatMode, setChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // 資産
  const [assets, setAssets] = useState({
    followers: state.assets.followers.toString(),
    contents: state.assets.contents.toString(),
    lineList: state.assets.lineList.toString(),
  });
  
  const chatEndRef = useRef(null);

  // 初回: AI分析を実行
  useEffect(() => {
    const analyze = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state })
        });
        
        if (!res.ok) throw new Error('分析に失敗しました');
        
        const data = await res.json();
        setAnalysis(data.report);
        setQuestions(data.questions || []);
        
        // 質問がなければStep1をスキップ
        if (!data.questions?.length && !data.needsWorkloadQuestion) {
          // 直接提案生成へ
          await generateProposal(data.report, answers);
        }
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    analyze();
  }, []);

  // 提案生成
  const generateProposal = async (analysisData, answersData) => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          state, 
          analysis: analysisData || analysis, 
          answers: answersData || answers 
        })
      });
      
      if (!res.ok) throw new Error('提案生成に失敗しました');
      
      const data = await res.json();
      setProposal(data);
      setEditedProposal(JSON.parse(JSON.stringify(data)));
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step1完了時
  const handleAnswersSubmit = async () => {
    setStep(2);
    await generateProposal(analysis, answers);
  };

  // チャットスクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 相談モード開始
  const startChat = () => {
    setChatMode(true);
    setChatMessages([{
      role: 'ai',
      content: '何か気になることある？KPI目標やタスクの調整、方針の相談など、なんでも聞いて。'
    }]);
  };

  // チャット送信
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          proposal: editedProposal,
          messages: chatMessages,
          userMessage: userMsg
        })
      });
      
      if (!res.ok) throw new Error('応答に失敗しました');
      
      const data = await res.json();
      
      setChatMessages(prev => [...prev, { role: 'ai', content: data.message }]);
      
      // 変更があれば提案を更新
      if (data.change) {
        applyChange(data.change);
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'ごめん、エラーが発生した。もう一度試してみて。' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // 変更を適用
  const applyChange = (change) => {
    if (!editedProposal) return;
    
    switch (change.type) {
      case 'kpi':
        setEditedProposal(prev => ({
          ...prev,
          kpiProposals: prev.kpiProposals.map(k => 
            k.channelId === change.channelId 
              ? { ...k, newTarget: change.newTarget, change: change.newTarget < k.currentTarget ? 'down' : 'up' }
              : k
          )
        }));
        break;
      case 'focus':
        setEditedProposal(prev => ({
          ...prev,
          weeklyFocusProposals: prev.weeklyFocusProposals?.map(f =>
            f.channelId === change.channelId
              ? { ...f, focus: change.newFocus }
              : f
          ) || [{ channelId: change.channelId, focus: change.newFocus }]
        }));
        break;
      case 'pause':
        // 一時停止の処理
        break;
    }
  };

  // 完了処理
  const handleComplete = () => {
    const finalProposal = editedProposal || proposal;
    
    // KPI達成判定
    const totalTarget = state.channels.reduce((s, c) => s + c.kpiTarget, 0);
    const totalCurrent = state.channels.reduce((s, c) => s + c.kpiCurrent, 0);
    const achieved = totalTarget > 0 && totalCurrent >= totalTarget * 0.8;

    // 履歴エントリ
    const historyEntry = {
      week: `${state.currentWeekStart}週`,
      channels: state.channels.map(c => {
        const kpiAnalysis = analysis?.kpiAnalysis?.find(k => k.channelId === c.id);
        return {
          name: c.name,
          kpi: c.kpiCurrent,
          target: c.kpiTarget,
          focus: c.weeklyFocus,
          focusDone: kpiAnalysis?.achieved || false
        };
      }),
      achieved,
      assets: {
        followers: Number(assets.followers),
        contents: Number(assets.contents),
        lineList: Number(assets.lineList),
      }
    };

    // 新しいチャネル状態
    const newChannels = state.channels.map(c => {
      const kp = finalProposal?.kpiProposals?.find(p => p.channelId === c.id);
      const fp = finalProposal?.weeklyFocusProposals?.find(p => p.channelId === c.id);
      const kpiAnalysis = analysis?.kpiAnalysis?.find(k => k.channelId === c.id);

      return {
        ...c,
        kpiTarget: kp?.newTarget || c.kpiTarget,
        kpiCurrent: 0,
        weeklyFocus: fp?.focus || '',
        consecutiveMiss: kpiAnalysis?.achieved ? 0 : (c.consecutiveMiss || 0) + 1,
        tasks: {
          once: c.tasks.once.filter(t => !t.done),
          continuous: c.tasks.continuous.map(t => ({ ...t, current: 0 }))
        }
      };
    });

    // 次の週
    const [m, d] = state.currentWeekStart.split('/').map(Number);
    const nextWeek = d + 7 > 28 ? `${m + 1}/1` : `${m}/${d + 7}`;

    onComplete({
      historyEntry,
      newChannels,
      nextWeek,
      achieved,
      newAssets: {
        followers: Number(assets.followers),
        contents: Number(assets.contents),
        lineList: Number(assets.lineList),
      }
    });
  };

  // ローディング表示
  if (loading && step === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-4" />
          <p className="text-slate-600">AIが分析中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error && !analysis) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-lg p-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-4" />
          <p className="text-slate-800 font-medium mb-2">エラーが発生しました</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 rounded-md text-slate-700"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  const hasQuestions = questions.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-violet-500" />
            <span className="font-semibold text-slate-800">週次サイクル</span>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 0: レポート */}
          {step === 0 && analysis && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Sparkles size={14} className="text-violet-500" />
                {analysis.summary}
              </div>

              {/* KPI */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xs font-medium text-slate-500 mb-3">📊 KPI</div>
                <div className="space-y-2">
                  {analysis.kpiAnalysis?.map(k => (
                    <div key={k.channelId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{k.channelName}</span>
                        {!k.achieved && k.insight && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            {k.insight.slice(0, 20)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${k.achieved ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {k.current}/{k.target} ({k.pct}%)
                        </span>
                        {k.achieved ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* インサイト */}
              {analysis.overallInsights?.length > 0 && (
                <div className="bg-violet-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-violet-600 mb-2">💡 傾向</div>
                  <ul className="space-y-1">
                    {analysis.overallInsights.map((insight, i) => (
                      <li key={i} className="text-sm text-violet-700">• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 売上・資産 */}
              {(analysis.salesInsight || analysis.assetsInsight) && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  {analysis.salesInsight && (
                    <p className="text-sm text-slate-600">💰 {analysis.salesInsight}</p>
                  )}
                  {analysis.assetsInsight && (
                    <p className="text-sm text-slate-600">📦 {analysis.assetsInsight}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1: 質問 */}
          {step === 1 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Bot size={14} className="text-violet-500" />
                いくつか聞かせて
              </div>

              {/* AI生成の質問 */}
              {questions.map(q => (
                <div key={q.id} className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-slate-700 mb-3">
                    {q.question}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setAnswers(prev => ({
                          ...prev,
                          reasons: { ...prev.reasons, [q.channelId]: option.id }
                        }))}
                        className={`p-3 rounded-lg text-left text-sm transition-all ${
                          answers.reasons[q.channelId] === option.id
                            ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                            : 'bg-white border border-slate-200 hover:border-violet-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* 稼働質問 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm font-medium text-slate-700 mb-3">
                  来週の稼働どのくらい取れそう？
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'normal', label: '通常通り', icon: Check },
                    { id: 'busy', label: '忙しい（70%）', icon: Coffee },
                    { id: 'very_busy', label: 'かなり忙しい（50%）', icon: AlertTriangle },
                    { id: 'extra', label: '余裕ある（120%）', icon: Zap },
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setAnswers(prev => ({ ...prev, workload: option.id }))}
                      className={`p-3 rounded-lg text-left text-sm flex items-center gap-2 transition-all ${
                        answers.workload === option.id
                          ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                          : 'bg-white border border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      <option.icon size={14} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 提案 */}
          {step === 2 && !chatMode && (
            <div className="p-5 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500 mb-2" />
                  <p className="text-sm text-slate-500">提案を作成中...</p>
                </div>
              ) : editedProposal ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Bot size={14} className="text-violet-500" />
                    来週の提案
                  </div>

                  {/* 方針 */}
                  <div className="bg-violet-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-violet-600 mb-2">📍 方針</div>
                    <div className="text-sm text-violet-800 font-medium">{editedProposal.strategy}</div>
                    {editedProposal.strategyReason && (
                      <div className="text-xs text-violet-600 mt-1">
                        理由: {editedProposal.strategyReason}
                      </div>
                    )}
                  </div>

                  {/* KPI目標 */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-slate-500 mb-3">🎯 KPI目標</div>
                    <div className="space-y-3">
                      {editedProposal.kpiProposals?.map(k => (
                        <div key={k.channelId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{k.channelIcon}</span>
                            <span className="text-sm">{k.channelName}</span>
                            {k.channelId === state.channels.find(c => c.name === editedProposal.focusChannel)?.id && (
                              <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">優先</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{k.newTarget}件</span>
                            {k.change === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                            {k.change === 'down' && <TrendingDown size={14} className="text-amber-500" />}
                            {k.change && k.change !== 'none' && (
                              <span className="text-xs text-slate-500">
                                ({k.currentTarget}→{k.newTarget})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {editedProposal.kpiProposals?.some(k => k.reason) && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                        {editedProposal.kpiProposals.filter(k => k.reason).map(k => (
                          <div key={k.channelId} className="text-xs text-slate-500">
                            {k.channelIcon} {k.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 励まし */}
                  {editedProposal.encouragement && (
                    <div className="bg-emerald-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-emerald-700">{editedProposal.encouragement}</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Chat Mode */}
          {step === 2 && chatMode && (
            <div className="flex flex-col h-full">
              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 min-h-[300px]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      msg.role === 'ai' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-500 text-white'
                    }`}>
                      {msg.role === 'ai' ? <Bot size={12} /> : 'U'}
                    </div>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                      msg.role === 'ai' ? 'bg-white border border-slate-200' : 'bg-violet-600 text-white'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                      <Loader2 size={12} className="animate-spin text-violet-600" />
                    </div>
                    <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg">
                      <span className="text-sm text-slate-400">考え中...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder="メッセージ..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm"
                  disabled={chatLoading}
                />
                <button 
                  onClick={sendChat} 
                  disabled={chatLoading}
                  className="px-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 rounded-md"
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 確定 */}
          {step === 3 && (
            <div className="p-5 space-y-4">
              {/* 資産更新 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xs font-medium text-slate-500 mb-3">📦 資産を更新</div>
                <div className="space-y-2">
                  {[
                    { key: 'followers', label: 'フォロワー' },
                    { key: 'contents', label: 'コンテンツ' },
                    { key: 'lineList', label: 'LINE登録' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-24">{item.label}</span>
                      <input
                        type="number"
                        value={assets[item.key]}
                        onChange={e => setAssets(prev => ({ ...prev, [item.key]: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* WHY */}
              {state.yearlyGoal.why && (
                <div className="bg-violet-50 rounded-lg p-4">
                  <p className="text-xs text-violet-500 mb-2">なんでこれやってるんだっけ？</p>
                  <p className="text-violet-700 font-medium">"{state.yearlyGoal.why}"</p>
                  <p className="text-xs text-violet-500 mt-2">来週もこれ忘れずに。</p>
                </div>
              )}

              {/* 最終確認 */}
              {editedProposal && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-500 mb-3">来週の設定</div>
                  <div className="space-y-2">
                    {editedProposal.kpiProposals?.map(k => (
                      <div key={k.channelId} className="flex items-center justify-between text-sm">
                        <span>{k.channelIcon} {k.channelName}</span>
                        <span className="font-bold">{k.newTarget}件</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          {step === 0 && (
            <button
              onClick={() => setStep(hasQuestions ? 1 : 2)}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-1"
            >
              次へ <ChevronRight size={14} />
            </button>
          )}

          {step === 1 && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-md text-sm font-medium"
              >
                戻る
              </button>
              <button
                onClick={handleAnswersSubmit}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-1"
              >
                次へ <ChevronRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && !chatMode && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(hasQuestions ? 1 : 0)}
                className="py-2.5 px-4 border border-slate-200 text-slate-600 rounded-md text-sm font-medium"
              >
                戻る
              </button>
              <button
                onClick={startChat}
                disabled={loading}
                className="flex-1 py-2.5 border border-violet-200 text-violet-600 hover:bg-violet-50 disabled:opacity-50 rounded-md text-sm font-medium"
              >
                相談する
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={loading}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-md text-sm font-medium"
              >
                これでOK
              </button>
            </div>
          )}

          {step === 2 && chatMode && (
            <button
              onClick={() => setChatMode(false)}
              className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-md text-sm font-medium"
            >
              提案に戻る
            </button>
          )}

          {step === 3 && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-md text-sm font-medium"
              >
                戻る
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-1"
              >
                <Rocket size={14} /> 来週へ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCycleModal;
