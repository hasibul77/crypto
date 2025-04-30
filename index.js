const axios = require('axios');

const CMC_API_KEY = '6268307e-b07e-47e5-9a56-8b6138ce0ade'; // Replace this with your CoinMarketCap API key

// === FETCH COINGECKO DATA ===
async function fetchCoinGeckoData(page = 1) {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250,
        page,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });

    const data = {};
    for (const coin of res.data) {
      const symbol = coin.symbol.toUpperCase();
      data[symbol] = {
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        circulating_supply: coin.circulating_supply,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        price_change_24h: coin.price_change_24h,
        price_change_percentage_24h: coin.price_change_percentage_24h
      };
    }

    return data;
  } catch (error) {
    console.error('CoinGecko Error:', error.message);
    return {};
  }
}

// === FETCH COINMARKETCAP DATA ===
async function fetchCoinMarketCapData(start = 1, limit = 100) {
  try {
    const res = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      params: {
        start,
        limit,
        convert: 'USD'
      },
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    const data = {};
    for (const coin of res.data.data) {
      const symbol = coin.symbol.toUpperCase();
      data[symbol] = {
        volume_24h: coin.quote.USD.volume_24h,
        percent_change_1h: coin.quote.USD.percent_change_1h,
        percent_change_7d: coin.quote.USD.percent_change_7d
      };
    }

    return data;
  } catch (error) {
    console.error('CoinMarketCap Error:', error.message);
    return {};
  }
}

// === MERGE BOTH SOURCES ===
async function fetchCombinedCryptoData() {
  const [cgData, cmcData] = await Promise.all([
    fetchCoinGeckoData(1),
    fetchCoinMarketCapData(1, 100)
  ]);

  const combined = [];

  for (const symbol in cgData) {
    if (cmcData[symbol]) {
      combined.push({
        symbol,
        ...cgData[symbol],
        ...cmcData[symbol]
      });
    }
  }

  console.log(`Combined ${combined.length} entries:`);
  console.log(combined.slice(0, 5)); // Show first 5 merged entries
}

fetchCombinedCryptoData();
