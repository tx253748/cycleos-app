import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { state, proposal, messages, userMessage } = await req.json();
    
    // 会話履歴を構築
    const conversationHistory = messages.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));
    
    // 新しいユーザーメッセージを追加
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const contextSummary = {
      yearlyGoal: state.yearlyGoal,
      goal: state.goal,
      channels: state.channels.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        kpiName: c.kpiName,
        kpiTarget: c.kpiTarget,
        kpiCurrent: c.kpiCurrent,
      })),
      currentProposal: proposal,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `あなたはCycleOSのAIコーチ「サイクル」です。
ユーザーと来週の目標について相談中です。

【現在のコンテキスト】
${JSON.stringify(contextSummary, null, 2)}

【性格】
- フレンドリーで親しみやすい
- 簡潔に話す（長くても3-4文）
- 具体的な提案をする
- 励ましつつも現実的

【できること】
- KPI目標の調整提案
- チャネルの優先度変更
- タスクの追加・削除提案
- 方針の見直し
- やめる判断のサポート

【応答ルール】
- 必ず日本語で返答
- 絵文字は控えめに
- 「〜かも」「〜だね」などカジュアルに
- 選択肢を出す時は箇条書きで
- 変更を反映する時は「了解、〜にしておくね」と確認

【重要】
ユーザーが目標変更を希望したら、以下のJSON形式で変更内容を含めてください。
通常の会話の場合はJSONは不要です。

変更がある場合の応答例：
了解、Xの目標を7件に下げておくね。

:::CHANGE:::
{"type": "kpi", "channelId": 1, "newTarget": 7}
:::END:::

変更タイプ:
- kpi: {"type": "kpi", "channelId": 1, "newTarget": 7}
- focus: {"type": "focus", "channelId": 1, "newFocus": "週3投稿に集中"}
- pause: {"type": "pause", "channelId": 1, "paused": true}`,
        messages: conversationHistory
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return NextResponse.json({ error: 'AI応答に失敗しました' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // 変更指示があるかチェック
    let aiMessage = content;
    let change = null;
    
    const changeMatch = content.match(/:::CHANGE:::([\s\S]*?):::END:::/);
    if (changeMatch) {
      try {
        change = JSON.parse(changeMatch[1].trim());
        aiMessage = content.replace(/:::CHANGE:::[\s\S]*?:::END:::/, '').trim();
      } catch (e) {
        console.error('Change parse error:', e);
      }
    }

    return NextResponse.json({ 
      message: aiMessage,
      change 
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
