import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { state } = await req.json();
    
    // データを要約して送信（トークン節約）
    const summary = {
      yearlyGoal: state.yearlyGoal,
      currentPhase: state.phases?.find(p => p.id === state.currentPhaseId),
      goal: state.goal,
      currentMonth: state.currentMonth,
      currentWeekStart: state.currentWeekStart,
      weekNumber: state.weekNumber,
      channels: state.channels.map(c => ({
        id: c.id,
        name: c.name,
        kpiName: c.kpiName,
        kpiTarget: c.kpiTarget,
        kpiCurrent: c.kpiCurrent,
        weeklyFocus: c.weeklyFocus,
        consecutiveMiss: c.consecutiveMiss || 0,
        tasksOnce: c.tasks.once.length,
        tasksDone: c.tasks.once.filter(t => t.done).length,
      })),
      monthlyDeals: state.deals?.filter(d => {
        const [m] = d.date.split('/').map(Number);
        return m === Number(state.currentMonth);
      }) || [],
      assets: state.assets,
      lastWeekAssets: state.weeklyHistory?.[0]?.assets || state.assets,
      recentHistory: state.weeklyHistory?.slice(0, 3) || [],
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
フリーランスや個人事業主の週次目標達成をサポートします。

【性格】
- フレンドリーで親しみやすい
- 具体的で実行可能なアドバイス
- 励ましつつも現実的
- 簡潔に話す

【分析の観点】
- KPI達成率と傾向（連続未達は要注意）
- 売上との相関（どのチャネルが成約に繋がってるか）
- 資産の積み上げ状況
- 稼働とのバランス

【出力形式】
必ず以下のJSON形式で返してください。他のテキストは不要です。
{
  "report": {
    "summary": "今週の一言コメント（50文字以内）",
    "kpiAnalysis": [
      {
        "channelId": 1,
        "channelName": "X",
        "current": 7,
        "target": 10,
        "pct": 70,
        "achieved": false,
        "trend": "down|stable|up",
        "insight": "3週連続未達。時間配分を見直すか目標調整を"
      }
    ],
    "salesInsight": "売上に関するコメント",
    "assetsInsight": "資産に関するコメント",
    "overallInsights": ["傾向1", "傾向2"]
  },
  "questions": [
    {
      "id": "q1",
      "channelId": 1,
      "question": "Xが未達続きだけど、何か理由ある？",
      "options": [
        {"id": "no_time", "label": "時間取れなかった"},
        {"id": "low_response", "label": "反応が薄い"},
        {"id": "low_priority", "label": "優先度下げてた"},
        {"id": "other", "label": "その他"}
      ]
    }
  ],
  "needsWorkloadQuestion": true
}`,
        messages: [{
          role: 'user',
          content: `以下のデータを分析してください。

${JSON.stringify(summary, null, 2)}`
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return NextResponse.json({ error: 'AI分析に失敗しました' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // JSONをパース
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      // JSONパースに失敗した場合、テキストからJSON部分を抽出
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ error: 'AI応答のパースに失敗', raw: content }, { status: 500 });
    }
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
