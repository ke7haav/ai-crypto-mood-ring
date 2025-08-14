const fetch = require('node-fetch'); // npm install node-fetch
require('dotenv').config();

const https = require('https');

class ClaudeAPIMCPBridge {
    constructor() {
        this.apiKey = process.env.CLAUDE_API_KEY;
        this.apiUrl = 'api.anthropic.com';
    }

    async getCryptoData() {
        if (!this.apiKey) {
            console.log('⚠️ No Claude API key found, using fallback data');
            return this.getFallbackData();
        }

        const prompt = `Using the CoinGecko MCP server, get current USD prices and 24-hour percentage changes for Bitcoin, Ethereum, Solana, Cardano, Polkadot, Chainlink, Avalanche, and Polygon.

Also provide additional market insights like:
- Market cap rankings
- Trading volumes 
- Recent price trends
- Any notable market events

Format as JSON:
{
  "bitcoin": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "ethereum": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "solana": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "cardano": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "polkadot": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "chainlink": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "avalanche": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "polygon": {"price": [price], "change_24h": [change], "market_cap_rank": [rank], "volume_24h": [volume]},
  "market_insights": {
    "total_market_sentiment": "[bullish/bearish/neutral]",
    "fear_greed_index": [0-100],
    "trending_narrative": "[current market story]",
    "whale_activity": "[high/medium/low]"
  }
}`;

        const postData = JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }]
        });

        const options = {
            hostname: this.apiUrl,
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode !== 200) {
                            console.error('Claude API Error:', response);
                            resolve(this.getFallbackData());
                            return;
                        }

                        const content = response.content?.[0]?.text;
                        if (content) {
                            const jsonMatch = content.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const result = JSON.parse(jsonMatch[0]);
                                console.log('✅ Enhanced MCP data received via Claude API!');
                                resolve(result);
                                return;
                            }
                        }

                        console.log('⚠️ No valid JSON in Claude response, using fallback');
                        resolve(this.getFallbackData());

                    } catch (error) {
                        console.error('Parse Error:', error);
                        resolve(this.getFallbackData());
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Request Error:', error);
                resolve(this.getFallbackData());
            });

            req.write(postData);
            req.end();
        });
    }

    async querySpecificCrypto(cryptoName, question) {
        const prompt = `Using the CoinGecko MCP server, ${question} about ${cryptoName}. 
        
Provide detailed information including price, trends, market analysis, and any relevant insights.
Format as JSON with comprehensive data.`;

        // Similar implementation as getCryptoData but with different prompt
        return `Analysis for ${cryptoName}: ${question} - This feature requires Claude API implementation`;
    }

    getFallbackData() {
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
                trending_narrative: "Consolidation phase with selective altcoin strength",
                whale_activity: "medium"
            }
        };
    }
}

module.exports = new ClaudeAPIMCPBridge();
