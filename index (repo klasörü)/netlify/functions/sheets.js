// Sovereign Engine v15.0 — Google Sheets Proxy
// CORS sorununu çözer, cache ekler

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQUQy_GNOXQTJLcSmekXQ-SuR_aQ0Smx4jypXIorUQ5p7quYVIAF2LKM8INQXp6BCgwrTMgCZjwTuHb/pub?output=csv';

let cache = { data: null, time: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika cache

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/csv; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Cache kontrolü
    if (cache.data && Date.now() - cache.time < CACHE_TTL) {
      return { statusCode: 200, headers, body: cache.data };
    }

    const response = await fetch(SHEETS_URL);
    if (!response.ok) throw new Error(`Sheets HTTP ${response.status}`);

    const text = await response.text();

    // Cache güncelle
    cache = { data: text, time: Date.now() };

    return { statusCode: 200, headers, body: text };

  } catch (error) {
    // Cache varsa eski veriyi döndür
    if (cache.data) {
      return { statusCode: 200, headers, body: cache.data };
    }
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
