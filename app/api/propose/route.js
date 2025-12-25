import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { state, analysis, answers } = await req.json();
    
    const summary = {
      yearlyGoal: state.yearlyGoal,
      goal: state.goal,
      channels: state.channels.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        kpiName: c.kpiName,
        kpiTarget: c.kpiTarget,
        kpiCurrent: c.kpiCurrent,
        weeklyFocus: c.weeklyFocus,
        consecutiveMiss: c.consecutiveMiss || 0,
        tasks: c.tasks,
        backlog: c.backlog || [],
      })),
      monthlyDeals: state.deals?.filter(d => {
        const [m] = d.date.split('/').map(Number);
        return m === Number(state.currentMonth);
      }) || [],
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
        max_tokens: 2048,
        system: `あなたはCycleOSのAIコーチ「サイクル」です。
ユーザーの回答を踏まえて、来週の具体的な提案をしてください。

【提案の原則】
- 未達が続いてて「時間がない」なら目標を現実的に下げる
- 未達が続いてて「反応薄い」なら方針の見直しを提案
- 好調で売上に繋がってるチャネルは維持or強化
- 稼働が少ないなら全体的に調整
- 稼働に余裕があるなら伸ばせるところを伸ばす

【タスク提案の原則】
- 各チャネルに2-3個の具体的なタスクを提案
- ユーザーの目標・フェーズに合わせた内容
- 実行可能で具体的なタスク名（「〇〇する」形式）
- 既存の未完了タスクは持ち越しとして含める
- 新規タスクは既存と被らないように

【出力形式】
必ず以下のJSON形式で返してください。
{
  "strategy": "来週の全体方針（30文字以内）",
  "strategyReason": "その理由（50文字以内）",
  "focusChannel": "最も注力すべきチャネル名",
  "kpiProposals": [
    {
      "channelId": 1,
      "channelName": "X",
      "channelIcon": "𝕏",
      "currentTarget": 10,
      "newTarget": 7,
      "change": "down|up|none",
      "reason": "変更理由（20文字以内）"
    }
  ],
  "taskProposals": [
    {
      "channelId": 1,
      "channelName": "X",
      "channelIcon": "𝕏",
      "existingTasks": [
        {"title": "固定ツイート更新", "type": "once", "status": "carryover"}
      ],
      "newTasks": [
        {"title": "実績ツイート3本作成", "type": "once", "reason": "信頼性向上のため"},
        {"title": "リプライ営業10件", "type": "continuous", "target": 10, "unit": "件", "reason": "見込み客との接点増"}
      ]
    }
  ],
  "weeklyFocusProposals": [
    {
      "channelId": 1,
      "focus": "週3投稿に絞って質を上げる"
    }
  ],
  "encouragement": "来週に向けた一言（30文字以内）"
}`,
        messages: [{
          role: 'user',
          content: `【現在の状況】
${JSON.stringify(summary, null, 2)}

【今週の分析結果】
${JSON.stringify(analysis, null, 2)}

【ユーザーの回答】
- 稼働予測: ${answers.workload === 'normal' ? '通常通り' : answers.workload === 'busy' ? '忙しい（70%）' : answers.workload === 'very_busy' ? 'かなり忙しい（50%）' : '余裕ある（120%）'}
- 未達の理由: ${JSON.stringify(answers.reasons)}
- 補足: ${answers.note || 'なし'}

来週の提案をお願いします。既存の未完了タスクを持ち越しつつ、新しいタスクも2-3個提案してください。`
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return NextResponse.json({ error: 'AI提案生成に失敗しました' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ error: 'AI応答のパースに失敗', raw: content }, { status: 500 });
    }
  } catch (error) {
    console.error('Propose error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
