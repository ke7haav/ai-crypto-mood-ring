let currentMoodData = null;
let autoRefreshInterval = null;
let isAutoRefresh = false;

// Fetch enhanced mood data
async function fetchMoodData() {
    try {
        const response = await fetch('/api/mood');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching mood data:', error);
        return null;
    }
}

// Update the main mood ring with enhanced effects
function updateMoodRing(moodData) {
    const moodRing = document.getElementById('moodRing');
    const moodText = document.getElementById('moodText');
    const moodIntensity = document.getElementById('moodIntensity');
    const moodPercentage = document.getElementById('moodPercentage');
    const moodDescription = document.getElementById('moodDescription');
    
    // Enhanced ring styling
    moodRing.style.background = `conic-gradient(${moodData.color}, ${moodData.color}aa, ${moodData.color})`;
    moodRing.style.boxShadow = `0 0 60px ${moodData.color}aa, inset 0 0 60px ${moodData.color}33`;
    
    // Update content
    moodText.textContent = moodData.mood;
    moodIntensity.textContent = moodData.intensity;
    moodPercentage.textContent = `${moodData.avgChange}%`;
    moodDescription.textContent = moodData.description;
    
    // Update stats
    document.getElementById('totalVolume').textContent = '$' + moodData.totalVolume;
    document.getElementById('avgChange').textContent = moodData.avgChange + '%';
    document.getElementById('moodScore').textContent = moodData.moodScore;
    
    // Update last updated time
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
}

// Update fear & greed gauge
async function updateFearGreedGauge() {
    try {
        const response = await fetch('/api/fear-greed');
        const data = await response.json();
        
        const gaugeFill = document.getElementById('gaugeFill');
        const gaugePointer = document.getElementById('gaugePointer');
        const gaugeValue = document.getElementById('gaugeValue');
        const gaugeSentiment = document.getElementById('gaugeSentiment');
        const gaugeEmoji = document.getElementById('gaugeEmoji');
        
        const percentage = data.index;
        gaugeFill.style.width = percentage + '%';
        gaugePointer.style.transform = `rotate(${(percentage - 50) * 1.8}deg)`;
        gaugeFill.style.background = data.color;
        
        gaugeValue.textContent = percentage;
        gaugeSentiment.textContent = data.sentiment;
        gaugeEmoji.textContent = data.emoji;
        
    } catch (error) {
        console.error('Error updating fear & greed gauge:', error);
    }
}

// Enhanced crypto grid with animations
function updateCryptoGrid(cryptoData) {
    const cryptoGrid = document.getElementById('cryptoGrid');
    cryptoGrid.innerHTML = '';
    
    Object.entries(cryptoData).forEach(([coin, data]) => {
        if (coin === 'market_insights') return;
        
        const card = document.createElement('div');
        card.className = 'crypto-card';
        
        const changeClass = data.change_24h >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change_24h >= 0 ? '+' : '';
        const trendIcon = data.change_24h >= 0 ? '📈' : '📉';
        
        card.innerHTML = `
            <div class="crypto-header">
                <h4>${coin.toUpperCase()}</h4>
                <span class="rank-badge">#${data.market_cap_rank || 'N/A'}</span>
            </div>
            <div class="crypto-price">$${data.price?.toLocaleString() || 'N/A'}</div>
            <div class="crypto-change ${changeClass}">
                ${trendIcon} ${changeSymbol}${data.change_24h?.toFixed(2) || 0}%
            </div>
            <div class="crypto-volume">
                Vol: $${(data.volume_24h / 1000000000)?.toFixed(1) || 0}B
            </div>
        `;
        
        // Add animation delay
        card.style.animationDelay = `${Object.keys(cryptoData).indexOf(coin) * 0.1}s`;
        card.classList.add('fade-in-up');
        
        cryptoGrid.appendChild(card);
    });
}

// Enhanced ask Claude function
async function askClaude() {
    const cryptoSelect = document.getElementById('cryptoSelect');
    const queryInput = document.getElementById('cryptoQuery');
    const responseDiv = document.getElementById('queryResponse');
    
    const crypto = cryptoSelect.value;
    const question = queryInput.value.trim();
    
    if (!question) {
        responseDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter a question';
        return;
    }
    
    responseDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claude AI is analyzing...';
    
    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crypto, question })
        });
        
        const data = await response.json();
        responseDiv.innerHTML = `
            <div class="ai-response">
                <div class="response-header">
                    <i class="fas fa-robot"></i> Claude's Analysis
                </div>
                <div class="response-content">${data.answer}</div>
            </div>
        `;
    } catch (error) {
        responseDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${error.message}`;
    }
}

// Auto-refresh toggle
function toggleAutoRefresh() {
    const autoBtn = document.getElementById('autoBtn');
    
    if (isAutoRefresh) {
        clearInterval(autoRefreshInterval);
        autoBtn.innerHTML = '<i class="fas fa-play"></i> Auto Refresh';
        autoBtn.style.background = 'var(--warning-gradient)';
        isAutoRefresh = false;
    } else {
        autoRefreshInterval = setInterval(updateMood, 30000); // 30 seconds
        autoBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Auto';
        autoBtn.style.background = 'var(--danger-gradient)';
        isAutoRefresh = true;
    }
}

// Enhanced share function
function shareToTwitter() {
    if (!currentMoodData) {
        alert('Please wait for data to load first!');
        return;
    }
    
    const tweetText = `🔮 Crypto Market Mood Ring Update!

Current Vibe: ${currentMoodData.mood} ${currentMoodData.intensity} (${currentMoodData.avgChange}%)
Fear & Greed: ${currentMoodData.fearGreedIndex}/100
Total Volume: $${currentMoodData.totalVolume}

${currentMoodData.description}

#BuildwithCoinGecko #CryptoMood #AI #MCP

Check it out: ${window.location.href}`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
}

// Main update function
async function updateMood() {
    console.log('🔄 Updating mood data...');
    const moodData = await fetchMoodData();
    
    if (moodData) {
        currentMoodData = moodData;
        updateMoodRing(moodData);
        updateCryptoGrid(moodData.cryptoData);
        await updateFearGreedGauge();
        
        console.log('✅ Mood updated successfully!');
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Enhanced Crypto Mood Ring initializing...');
    updateMood();
    
    // Add some cool entrance animations
    document.body.classList.add('loaded');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .fade-in-up {
        animation: fadeInUp 0.6s ease forwards;
        opacity: 0;
        transform: translateY(30px);
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .crypto-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .rank-badge {
        background: rgba(255,255,255,0.2);
        padding: 4px 8px;
        border-radius: 10px;
        font-size: 0.8em;
    }
    
    .crypto-price {
        font-size: 1.8em;
        font-weight: bold;
        margin-bottom: 10px;
        color: white;
    }
    
    .crypto-change {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 15px;
        display: inline-block;
    }
    
    .positive {
        background: rgba(68, 255, 68, 0.2);
        color: #44ff44;
    }
    
    .negative {
        background: rgba(255, 68, 68, 0.2);
        color: #ff4444;
    }
    
    .crypto-volume {
        color: rgba(255,255,255,0.7);
        font-size: 0.9em;
    }
    
    .ai-response {
        border-left: 4px solid #44ff44;
        padding-left: 15px;
    }
    
    .response-header {
        font-weight: bold;
        margin-bottom: 10px;
        color: #44ff44;
    }
    
    .response-content {
        line-height: 1.6;
    }
`;
document.head.appendChild(style);
