const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const parseGemmaText = (data) => data?.candidates
  ?.flatMap(candidate => candidate?.content?.parts || [])
  ?.map(part => part?.text || '')
  ?.join('\n')
  ?.trim();

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return jsonResponse(500, {
      error: 'Gemma API key is not configured. Set GEMINI_API_KEY or GOOGLE_AI_API_KEY in Netlify.',
    });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Request body must be valid JSON.' });
  }

  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';

  if (!prompt) {
    return jsonResponse(400, { error: 'Prompt is required.' });
  }

  const model = process.env.GEMMA_MODEL || 'gemma-4-31b-it';
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: data?.error?.message || 'Gemma request failed.',
      });
    }

    const answer = parseGemmaText(data);

    return jsonResponse(200, {
      answer: answer || 'Gemma returned an empty response.',
      model,
    });
  } catch (error) {
    return jsonResponse(502, {
      error: error.message || 'Unable to reach Gemma.',
    });
  }
};
