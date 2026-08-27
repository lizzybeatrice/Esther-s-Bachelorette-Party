const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const store = getStore('rsvps');

  if (event.httpMethod === 'GET') {
    const data = (await store.get('list', { type: 'json' })) || [];
    // newest first
    data.sort((a, b) => new Date(b.time) - new Date(a.time));
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers: CORS, body: 'Invalid JSON' };
    }

    const name = String(body.name || '').trim().slice(0, 80);
    const status = body.status;

    if (!name || (status !== 'yes' && status !== 'no')) {
      return { statusCode: 400, headers: CORS, body: 'Invalid payload' };
    }

    const data = (await store.get('list', { type: 'json' })) || [];
    data.push({
      name,
      status,
      time: new Date().toISOString()
    });
    await store.setJSON('list', data);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  }

  return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
};
