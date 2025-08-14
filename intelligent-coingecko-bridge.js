const https = require('https');

class IntelligentCoinGeckoBridge {
    constructor() {
        this.apiKey = process.env.COINGECKO_API_KEY; // Optional for Pro API
        this.baseUrl = 'api.coingecko.com';
        this.llmsContext = this.loadLLMsContext();
    }

    loadLLMsContext() {
        // Context from CoinGecko's llms.txt for intelligent API usage
        return {
            simple_price: {
                endpoint: '/api/v3/simple/price',
                description: 'Query prices of one or more coins by using their unique Coin API IDs',
                params: ['ids', 'vs_currencies', 'include_market_cap', 'include_24hr_vol', 'include_24hr_change']
            },
            coins_markets: {
                endpoint: '/api/v3/coins/markets',
                description: 'Query all supported coins with price, market cap, volume and market related data',
                params: ['vs_currency', 'order', 'per_page', 'page', 'sparkline', 'price_change_percentage']
            },
            coins_id: {
                endpoint: '/api/v3/coins/{id}',
                description: 'Query all metadata and market data of a coin from CoinGecko based on coin ID',
                params: ['localization', 'tickers', 'market_data', 'community_data', 'developer_data', 'sparkline']
            },
            trending: {
                endpoint: '/api/v3/search/trending',
                description: 'Query trending search coins, NFTs and categories on CoinGecko in the last 24 hours'
            },
            global: {
                endpoint: '/api/v3/global',
                description: 'Query cryptocurrency global data including active cryptocurrencies, markets, total crypto market cap'
            },
            top_gainers_losers: {
                endpoint: '/api/v3/coins/top_gainers_losers',
                description: 'Query the top 30 coins with largest price gain and loss by specific time duration',
                params: ['vs_currency', 'duration']
            }
        };
    }

    async intelligentQuery(userQuestion) {
        console.log(`🤖 Processing intelligent query: "${userQuestion}"`);
        
        // AI logic to determine which API endpoint to use based on user question
        const queryPlan = this.analyzeUserIntent(userQuestion);
        console.log(`🧠 Query plan: ${JSON.stringify(queryPlan)}`);
        
        try {
            const data = await this.executeAPICall(queryPlan);
            return this.formatIntelligentResponse(data, userQuestion, queryPlan);
        } catch (error) {
            console.error('API call failed:', error);
            return this.createErrorResponse(userQuestion, error);
        }
    }

   analyzeUserIntent(question) {
    const lowerQ = question.toLowerCase();
    
    // Enhanced intent detection with better keyword matching
    if (lowerQ.includes('price') || lowerQ.includes('worth') || lowerQ.includes('cost') || lowerQ.includes('much')) {
        // Check if specific coins are mentioned
        const coinNames = this.extractCoinNames(question);
        if (coinNames.length > 0) {
            return {
                type: 'simple_price',
                coins: coinNames,
                includeChange: true,
                includeVolume: lowerQ.includes('volume'),
                includeMarketCap: lowerQ.includes('market cap') || lowerQ.includes('marketcap')
            };
        }
    }
    
    if (lowerQ.includes('trending') || lowerQ.includes('popular') || lowerQ.includes('hot')) {
        return { type: 'trending' };
    }
    
    if (lowerQ.includes('gainers') || lowerQ.includes('losers') || lowerQ.includes('top')) {
        return { 
            type: 'top_gainers_losers',
            duration: lowerQ.includes('hour') ? '1h' : '24h'
        };
    }
    
    if (lowerQ.includes('market') && (lowerQ.includes('overview') || lowerQ.includes('global'))) {
        return { type: 'global' };
    }
    
    if (lowerQ.includes('detailed') || lowerQ.includes('information') || lowerQ.includes('about')) {
        return {
            type: 'coins_id',
            coinId: this.extractPrimaryCoin(question)
        };
    }
    
    // Default to market overview ONLY if no specific intent detected
    return { 
        type: 'coins_markets',
        limit: 10,
        includeChange: true
    };
}


extractCoinNames(question) {
    const coinMap = {
        'bitcoin': 'bitcoin', 'btc': 'bitcoin',
        'ethereum': 'ethereum', 'eth': 'ethereum',
        'solana': 'solana', 'sol': 'solana',
        'cardano': 'cardano', 'ada': 'cardano',
        'polkadot': 'polkadot', 'dot': 'polkadot',
        'chainlink': 'chainlink', 'link': 'chainlink',
        'avalanche': 'avalanche-2', 'avax': 'avalanche-2',
        'polygon': 'matic-network', 'matic': 'matic-network'
    };
    
    const found = [];
    Object.keys(coinMap).forEach(key => {
        if (question.toLowerCase().includes(key)) {
            found.push(coinMap[key]);
        }
    });
    
    console.log(`🔍 Extracted coins from "${question}":`, found);
    return found.length > 0 ? found : null; // Return null instead of default coins
}


    extractPrimaryCoin(question) {
        const coins = this.extractCoinNames(question);
        return coins[0] || 'bitcoin';
    }

async executeAPICall(queryPlan) {
    let path = '';
    let params = new URLSearchParams();
    
    // ADD THIS COMPLETE SWITCH STATEMENT:
    switch (queryPlan.type) {
        case 'simple_price':
            path = '/api/v3/simple/price';
            params.append('ids', queryPlan.coins.join(','));
            params.append('vs_currencies', 'usd');
            if (queryPlan.includeChange) params.append('include_24hr_change', 'true');
            if (queryPlan.includeVolume) params.append('include_24hr_vol', 'true');
            if (queryPlan.includeMarketCap) params.append('include_market_cap', 'true');
            break;
            
        case 'coins_markets':
            path = '/api/v3/coins/markets';
            params.append('vs_currency', 'usd');
            params.append('order', 'market_cap_desc');
            params.append('per_page', queryPlan.limit || '10');
            params.append('page', '1');
            if (queryPlan.includeChange) params.append('price_change_percentage', '24h');
            break;
            
        case 'trending':
            path = '/api/v3/search/trending';
            break;
            
        case 'global':
            path = '/api/v3/global';
            break;
            
        case 'top_gainers_losers':
            path = '/api/v3/coins/top_gainers_losers';
            params.append('vs_currency', 'usd');
            params.append('duration', queryPlan.duration || '24h');
            break;
            
        case 'coins_id':
            path = `/api/v3/coins/${queryPlan.coinId}`;
            params.append('localization', 'false');
            params.append('tickers', 'false');
            params.append('market_data', 'true');
            break;
            
        default:
            path = '/api/v3/coins/markets';
            params.append('vs_currency', 'usd');
            params.append('order', 'market_cap_desc');
            params.append('per_page', '10');
            params.append('page', '1');
            params.append('price_change_percentage', '24h');
            break;
    }
    
    const fullPath = params.toString() ? `${path}?${params.toString()}` : path;
    
    console.log(`🌐 Making API call to: https://${this.baseUrl}${fullPath}`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: this.baseUrl,
            port: 443,
            path: fullPath,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Crypto-Mood-Ring/1.0',
                ...(this.apiKey && { 'x-cg-pro-api-key': this.apiKey })
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📡 API Response Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        console.error(`❌ API Error ${res.statusCode}:`, data);
                        reject(new Error(`API returned ${res.statusCode}: ${data}`));
                        return;
                    }
                    
                    const parsedData = JSON.parse(data);
                    console.log(`✅ API Success: Received ${Array.isArray(parsedData) ? parsedData.length : 'object'} items`);
                    resolve(parsedData);
                } catch (error) {
                    console.error('❌ JSON Parse Error:', error);
                    console.error('Raw response:', data.substring(0, 200));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Network Error:', error);
            reject(error);
        });

        req.setTimeout(10000, () => {
            console.error('❌ Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}


    formatIntelligentResponse(data, originalQuestion, queryPlan) {
        const response = {
            question: originalQuestion,
            queryType: queryPlan.type,
            data: data,
            analysis: this.generateAIAnalysis(data, queryPlan),
            timestamp: new Date().toISOString(),
            dataSource: 'CoinGecko API via Intelligent Bridge'
        };
        
        return response;
    }

    generateAIAnalysis(data, queryPlan) {
        switch (queryPlan.type) {
            case 'simple_price':
                return this.analyzePriceData(data);
            case 'coins_markets':
                return this.analyzeMarketData(data);
            case 'trending':
                return this.analyzeTrendingData(data);
            case 'global':
                return this.analyzeGlobalData(data);
            default:
                return "Data retrieved successfully from CoinGecko API";
        }
    }

    analyzePriceData(data) {
        const analyses = [];
        Object.entries(data).forEach(([coin, priceData]) => {
            const change = priceData.usd_24h_change || 0;
            const changeText = change > 0 ? `up ${change.toFixed(2)}%` : `down ${Math.abs(change).toFixed(2)}%`;
            analyses.push(`${coin.toUpperCase()} is currently $${priceData.usd.toLocaleString()} (${changeText} in 24h)`);
        });
        return analyses.join('. ');
    }

    analyzeMarketData(data) {
        if (!Array.isArray(data) || data.length === 0) return "No market data available";
        
        const topCoin = data[0];
        const avgChange = data.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) / data.length;
        
        let sentiment = "neutral";
        if (avgChange > 2) sentiment = "bullish";
        else if (avgChange < -2) sentiment = "bearish";
        
        return `Market sentiment appears ${sentiment} with average 24h change of ${avgChange.toFixed(2)}%. ${topCoin.name} leads at $${topCoin.current_price?.toLocaleString()}.`;
    }

    analyzeTrendingData(data) {
        if (!data.coins || data.coins.length === 0) return "No trending data available";
        
        const topTrending = data.coins.slice(0, 3).map(coin => coin.item.name).join(', ');
        return `Currently trending cryptocurrencies include: ${topTrending}. These coins are seeing increased search interest in the last 24 hours.`;
    }

    analyzeGlobalData(data) {
        if (!data.data) return "Global market data unavailable";
        
        const marketCap = (data.data.total_market_cap?.usd / 1e12).toFixed(2);
        const volume = (data.data.total_volume?.usd / 1e9).toFixed(1);
        const dominance = data.data.market_cap_percentage?.btc?.toFixed(1);
        
        return `Global crypto market cap is $${marketCap}T with $${volume}B in 24h volume. Bitcoin dominance: ${dominance}%.`;
    }

    createErrorResponse(question, error) {
        return {
            question,
            error: true,
            message: `Sorry, I couldn't process your question about crypto data. Error: ${error.message}`,
            suggestion: "Try asking about specific coin prices, market trends, or global crypto data.",
            timestamp: new Date().toISOString()
        };
    }

    // Method to get enhanced mood ring data
    async getMoodRingData() {
   console.log('🔮 Fetching mood ring data from CoinGecko API...');
    
    try {
        // Use the working API call that your AI chat uses
        const marketData = await this.executeAPICall({
            type: 'coins_markets',
            limit: 10,
            includeChange: true
        });

        console.log('📊 Market data received:', marketData);

        if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
            console.warn('⚠️ Invalid market data, using fallback');
            return this.getFallbackMoodData();
        }

        return this.createMoodRingResponse(marketData);
        
    } catch (error) {
        console.error('❌ API call failed in getMoodRingData:', error);
        console.log('🔄 Falling back to demo data');
        return this.getFallbackMoodData();
    }
    }

createMoodRingResponse(marketData) {
    console.log('🏗️ Creating mood ring response from real data...');
    
    if (!marketData || !Array.isArray(marketData)) {
        console.warn('Invalid market data structure');
        return this.getFallbackMoodData();
    }

    const cryptoData = {};
    
    // Map the real CoinGecko API response to your expected format
    marketData.slice(0, 8).forEach(coin => {
        let coinId = coin.id;
        
        // Handle special cases for coin naming
        if (coinId === 'avalanche-2') coinId = 'avalanche';
        if (coinId === 'matic-network') coinId = 'polygon';
        
        cryptoData[coinId] = {
            price: coin.current_price || 0,
            change_24h: coin.price_change_percentage_24h || 0,
            market_cap_rank: coin.market_cap_rank || 999,
            volume_24h: coin.total_volume || 0
        };
    });

    // Calculate real market insights from actual data
    const changes = marketData.map(coin => coin.price_change_percentage_24h || 0);
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const totalVolume = marketData.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
    
    // Generate real market insights
    cryptoData.market_insights = {
        total_market_sentiment: avgChange > 1 ? "bullish" : avgChange < -1 ? "bearish" : "neutral",
        fear_greed_index: Math.max(0, Math.min(100, Math.round(50 + (avgChange * 10)))),
        trending_narrative: this.generateRealMarketNarrative(avgChange, totalVolume),
        whale_activity: totalVolume > 100e9 ? "high" : totalVolume > 50e9 ? "medium" : "low"
    };

    console.log('✅ Real mood ring data created:', Object.keys(cryptoData));
    return cryptoData;
}


generateRealMarketNarrative(avgChange, totalVolume) {
    const volumeInB = (totalVolume / 1e9).toFixed(1);
    
    if (avgChange > 3) return `Strong bullish momentum with ${volumeInB}B in volume - bulls are in control!`;
    if (avgChange > 1) return `Moderate gains across markets with healthy ${volumeInB}B volume`;
    if (avgChange > -1) return `Sideways consolidation with ${volumeInB}B in trading activity`;
    if (avgChange > -3) return `Minor correction phase with ${volumeInB}B volume - potential buying opportunity`;
    return `Market stress with ${volumeInB}B volume - diamond hands being tested`;
}


    getFallbackMoodData() {
        return {
            bitcoin: { price: 45000, change_24h: -2.5, market_cap_rank: 1, volume_24h: 15000000000 },
            ethereum: { price: 2800, change_24h: -1.8, market_cap_rank: 2, volume_24h: 8000000000 },
            solana: { price: 95, change_24h: 3.2, market_cap_rank: 5, volume_24h: 1500000000 },
            cardano: { price: 0.45, change_24h: -0.8, market_cap_rank: 8, volume_24h: 500000000 },
            polkadot: { price: 6.2, change_24h: 1.5, market_cap_rank: 12, volume_24h: 300000000 },
            chainlink: { price: 14.8, change_24h: -3.1, market_cap_rank: 15, volume_24h: 400000000 },
            avalanche: { price: 32.1, change_24h: 2.8, market_cap_rank: 18, volume_24h: 250000000 },
            polygon: { price: 0.85, change_24h: -1.2, market_cap_rank: 20, volume_24h: 200000000 },
            market_insights: {
                total_market_sentiment: "neutral",
                fear_greed_index: 45,
                trending_narrative: "AI-powered analysis with CoinGecko data integration",
                whale_activity: "medium"
            }
        };
    }

}
module.exports = new IntelligentCoinGeckoBridge();
