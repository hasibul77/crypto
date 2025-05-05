const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = 3000;

const MONGODB_URI = 'mongodb+srv://hasibhimel557:himel0001@cluster0.ktnsk63.mongodb.net/crypto_db?retryWrites=true&w=majority';
const CMC_API_KEY = '6268307e-b07e-47e5-9a56-8b6138ce0ade';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const cryptoSchema = new mongoose.Schema({
  symbol: String,
  name: String,
  image: String,
  current_price: Number,
  market_cap: Number,
  market_cap_rank: Number,
  circulating_supply: Number,
  high_24h: Number,
  low_24h: Number,
  price_change_24h: Number,
  price_change_percentage_24h: Number,
  volume_24h: Number,
  percent_change_1h: Number,
  percent_change_7d: Number,
}, { timestamps: true });

const Crypto = mongoose.model('Crypto', cryptoSchema);

const getMergeKey = (symbol, name) => `${symbol.toUpperCase()}_${name.toLowerCase()}`;

async function fetchCoinGeckoData() {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });

    const data = {};
    res.data.forEach(coin => {
      const key = getMergeKey(coin.symbol, coin.name);
      data[key] = {
        symbol: coin.symbol.toUpperCase(),
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
    });
    return data;
  } catch (err) {
    console.error('CoinGecko error:', err.message);
    return {};
  }
}

async function fetchCoinMarketCapData() {
  try {
    const res = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      params: {
        start: 1,
        limit: 100,
        convert: 'USD'
      },
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY
      }
    });

    const data = {};
    res.data.data.forEach(coin => {
      const key = getMergeKey(coin.symbol, coin.name);
      data[key] = {
        volume_24h: coin.quote.USD.volume_24h,
        percent_change_1h: coin.quote.USD.percent_change_1h,
        percent_change_7d: coin.quote.USD.percent_change_7d
      };
    });
    return data;
  } catch (err) {
    console.error('CoinMarketCap error:', err.message);
    return {};
  }
}

async function fetchAndStoreCombinedData() {
  try {
    const [cgData, cmcData] = await Promise.all([
      fetchCoinGeckoData(),
      fetchCoinMarketCapData()
    ]);

    const combined = [];

    for (const key in cgData) {
      const cg = cgData[key];
      const cmc = cmcData[key] || {};
      combined.push({ ...cg, ...cmc });
    }

    combined.sort((a, b) => a.market_cap_rank - b.market_cap_rank);

    let updatedCount = 0;

    for (const coin of combined) {
      await Crypto.findOneAndUpdate(
        { symbol: coin.symbol, name: coin.name },
        { $set: coin },
        { upsert: true, new: true }
      );
      updatedCount++;
    }

    console.log(`✅ Updated ${updatedCount} coins at ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('❌ Error during fetchAndStoreCombinedData:', error.message);
  }
}

// First fetch and then repeat every 5 minutes
fetchAndStoreCombinedData();
setInterval(fetchAndStoreCombinedData, 5 * 60 * 1000);

// 🚀 API Route to get all coins
app.get('/api/cryptos', async (req, res) => {
  try {
    const cryptos = await Crypto.find().sort({ market_cap_rank: 1 });
    res.json(cryptos);
  } catch (error) {
    console.error('Error fetching cryptos:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
