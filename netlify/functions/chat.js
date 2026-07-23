// Ten AI 어시스턴트 - BytePlus ModelArk 프록시 (서버 전용)
// API 키는 Netlify 환경변수(BYTEPLUS_API_KEY)에서만 읽습니다.
// 브라우저에는 절대 키가 노출되지 않습니다.

exports.handler = async (event) => {
  // POST만 허용
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.BYTEPLUS_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '서버에 API 키가 설정되지 않았습니다. (BYTEPLUS_API_KEY)' }),
    };
  }

  let message = '';
  try {
    const body = JSON.parse(event.body || '{}');
    message = (body.message || '').toString().trim();
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: '잘못된 요청 형식입니다.' }) };
  }

  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ error: '메시지가 비어 있습니다.' }) };
  }
  if (message.length > 2000) {
    return { statusCode: 400, body: JSON.stringify({ error: '메시지가 너무 깁니다. (최대 2000자)' }) };
  }

  try {
    const response = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro-260425',
        messages: [
          {
            role: 'system',
            content:
              '당신은 Ten AI의 AI 어시스턴트입니다. 정원훈 대표이사를 대신하여 AI 경영 컨설팅, 지식재산 전략, AI 기술 통역에 관한 전문적인 답변을 제공합니다. 한국어로 친절하고 전문적으로 답변하세요.',
          },
          { role: 'user', content: message },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'AI 서버 오류 (' + response.status + ')', detail: errText.slice(0, 300) }),
      };
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || '(응답이 비어 있습니다.)';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: '요청 처리 중 오류: ' + err.message }) };
  }
};
