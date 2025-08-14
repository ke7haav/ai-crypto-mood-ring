const express = require('express');
const cors = require('cors');
const intelligentBridge = require('./intelligent-coingecko-bridge');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Enhanced mood endpoint with real CoinGecko data
app.get('/api/mood', async (req, res) => {
    try {
        console.log('🔮 Fetching intelligent mood data...');
        const cryptoData = await intelligentBridge.getMoodRingData();
        const marketMood = calculateAdvancedMood(cryptoData);
        
        res.json({
            ...marketMood,
            cryptoData,
            marketInsights: cryptoData.market_insights,
            timestamp: new Date().toISOString(),
            dataSource: 'Intelligent CoinGecko API Bridge'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// Intelligent AI query endpoint
app.post('/api/intelligent-query', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log('🧠 Processing intelligent query:', question);
        const response = await intelligentBridge.intelligentQuery(question);
        res.json(response);
    } catch (error) {
        console.error('Intelligent query error:', error);
        res.status(500).json({ error: 'Failed to process intelligent query' });
    }
});

// Your existing mood calculation function
function calculateAdvancedMood(cryptoData) {
    const coins = Object.values(cryptoData).filter(coin => coin.price);
    const marketInsights = cryptoData.market_insights || {};
    
    const priceChanges = coins.map(coin => coin.change_24h || 0);
    const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    
    const volumes = coins.map(coin => coin.volume_24h || 0);
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    
    const fearGreedIndex = marketInsights.fear_greed_index || 50;
    
    let moodScore = (avgChange * 0.4) + ((fearGreedIndex - 50) * 0.1) + (totalVolume > 50000000000 ? 2 : -1);
    
    let mood, color, description, intensity;
    
    if (moodScore > 3) {
        mood = "Euphoric";
        color = "#00ff88";
        intensity = "Extreme";
        description = "🚀 AI detects MOON MISSION potential! Bulls charging!";
    } else if (moodScore > 1) {
        mood = "Bullish";
        color = "#44ff44";
        intensity = "High";
        description = "📈 AI analysis shows strong positive momentum!";
    } else if (moodScore > -1) {
        mood = "Neutral";
        color = "#ffaa00";
        intensity = "Medium";
        description = "⚖️ AI sees balanced market conditions, waiting...";
    } else if (moodScore > -3) {
        mood = "Bearish";
        color = "#ff6600";
        intensity = "High";
        description = "📉 AI detects selling pressure, but opportunities ahead!";
    } else {
        mood = "Panic";
        color = "#ff0044";
        intensity = "Extreme";
        description = "🤖 AI recommends: Stay calm, this too shall pass!";
    }
    
    return { 
        mood, 
        color, 
        intensity,
        description, 
        avgChange: avgChange.toFixed(2),
        moodScore: moodScore.toFixed(2),
        totalVolume: (totalVolume / 1000000000).toFixed(1) + "B",
        fearGreedIndex
    };
}

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🔮 Enhanced Crypto Mood Ring Server running on http://localhost:${PORT}`);
        console.log('🤖 AI-powered CoinGecko integration active!');
        console.log('📊 Using CoinGecko llms.txt for optimal API usage');
    });
}