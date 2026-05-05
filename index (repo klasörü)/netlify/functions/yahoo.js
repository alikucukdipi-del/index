// Sovereign Engine v15.0 — Yahoo Finance Proxy
// Netlify Function — CORS sorununu çözer

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const ticker = event.queryStringParameters?.ticker;
  const gun = parseInt(event.queryStringParameters?.gun || '40');

  if (!ticker) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'ticker parametresi gerekli' })
    };
  }

  try {
    const bitis = Math.floor(Date.now() / 1000);
    const baslangic = bitis - (gun * 24 * 60 * 60);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${baslangic}&period2=${bitis}&interval=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo HTTP ${response.status}`);
    }

    const data = await response.json();
    const chart = data?.chart?.result?.[0];

    if (!chart) {
      throw new Error('Veri bulunamadı');
    }

    const kapanis = chart.indicators.quote[0].close;
    const hacim = chart.indicators.quote[0].volume;
    const timestamps = chart.timestamp;
    const meta = chart.meta;

    // Temiz veri döndür
    const veriler = timestamps.map((t, i) => ({
      tarih: new Date(t * 1000).toISOString().split('T')[0],
      kapanis: kapanis[i],
      hacim: hacim[i] || 0
    })).filter(d => d.kapanis !== null && d.kapanis > 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ticker,
        currency: meta.currency,
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        veriler
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
