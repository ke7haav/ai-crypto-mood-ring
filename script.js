let currentMoodData = null;
let autoRefreshInterval = null;
let isAutoRefresh = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AI Crypto Mood Ring initializing...');
    initializeApp();
});

async function initializeApp() {
    showLoadingState();
    await refreshData();
    updateTimestamp();
}

function showLoadingState() {
    document.getElementById('moodText').textContent = 'Loading...';
    document.getElementById('moodEmoji').textContent = '🔮';
    document.getElementById('changeValue').textContent = '0%';
}

// Fetch mood data from backend
async function fetchMoodData() {
    try {
        console.log('📡 Fetching mood data...');
        const response = await fetch('/api/mood');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Mood data received:', data);
        return data;
    } catch (error) {
        console.error('❌ Error fetching mood data:', error);
        return null;
    }
}

// Update the mood ring display
function updateMoodRing(moodData) {
    if (!moodData) return;
    
    console.log('🎨 Updating mood ring display...');
    
    // Update mood ring
    const moodRing = document.getElementById('moodRing');
    const moodText = document.getElementById('moodText');
    const moodEmoji = document.getElementById('moodEmoji');
    const changeValue = document.getElementById('changeValue');
    const intensityBadge = document.getElementById('intensityBadge');
    const moodTitle = document.getElementById('moodTitle');
    const moodDesc = document.getElementById('moodDesc');
    
    // Set ring color
    moodRing.style.background = `conic-gradient(from 0deg, ${moodData.color}, ${moodData.color}aa, ${moodData.color})`;
    moodRing.style.boxShadow = `0 0 60px ${moodData.color}66, inset 0 0 30px ${moodData.color}33`;
    
    // Update text content
    moodText.textContent = moodData.mood || 'Unknown';
    changeValue.textContent = `${moodData.avgChange || 0}%`;
    intensityBadge.textContent = moodData.intensity || 'Medium';
    moodDesc.textContent = moodData.description || 'Market analysis in progress...';
    
    // Set change color
    const changeElement = document.getElementById('changeValue');
    changeElement.className = parseFloat(moodData.avgChange || 0) >= 0 ? 'positive' : 'negative';
    
    // Set intensity badge color
    const intensityElement = document.getElementById('intensityBadge');
    intensityElement.style.background = moodData.color || '#999';
    intensityElement.style.color = 'white';
    
    // Set emoji based on mood
    const emojiMap = {
        'Euphoric': '🚀',
        'Bullish': '📈',
        'Neutral': '⚖️',
        'Bearish': '📉',
        'Panic': '😱'
    };
    moodEmoji.textContent = emojiMap[moodData.mood] || '🔮';
    
    console.log('✅ Mood ring updated successfully');
}

// Update market stats
function updateStats(moodData) {
    if (!moodData) return;
    
    console.log('📊 Updating market stats...');
    
    document.getElementById('totalVolume').textContent = `$${moodData.totalVolume || '0B'}`;
    document.getElementById('avgChange').textContent = `${moodData.avgChange || 0}%`;
    document.getElementById('fearGreed').textContent = moodData.fearGreedIndex || '50';
    document.getElementById('aiScore').textContent = moodData.moodScore || '0.0';
    
    // Set avg change color
    const avgChangeElement = document.getElementById('avgChange');
    avgChangeElement.className = parseFloat(moodData.avgChange || 0) >= 0 ? 'positive' : 'negative';
}

// Update crypto grid
function updateCryptoGrid(cryptoData) {
    if (!cryptoData) return;
    
    console.log('💎 Updating crypto grid...');
    
    const cryptoGrid = document.getElementById('cryptoGrid');
    cryptoGrid.innerHTML = '';
    
    // Filter out market_insights
    const cryptoEntries = Object.entries(cryptoData).filter(([key]) => key !== 'market_insights');
    
    if (cryptoEntries.length === 0) {
        cryptoGrid.innerHTML = '<div class="crypto-loading"><p>No crypto data available</p></div>';
        return;
    }
    
    cryptoEntries.forEach(([coin, data], index) => {
        const card = document.createElement('div');
        card.className = 'crypto-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const change = data.change_24h || 0;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeSymbol = change >= 0 ? '+' : '';
        const trendIcon = change >= 0 ? '📈' : '📉';
        
        card.innerHTML = `
            <div class="crypto-header">
                <h3 style="color: white; margin-bottom: 10px;">${coin.toUpperCase().replace(/-/g, ' ')}</h3>
                <span class="rank-badge" style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 10px; font-size: 0.8em; color: white;">
                    #${data.market_cap_rank || 'N/A'}
                </span>
            </div>
            <div style="font-size: 1.8em; font-weight: bold; margin-bottom: 10px; color: white;">
                $${typeof data.price === 'number' ? data.price.toLocaleString() : 'N/A'}
            </div>
            <div class="crypto-change ${changeClass}" style="font-weight: bold; padding: 8px 12px; border-radius: 15px; margin-bottom: 10px; display: inline-block;">
                ${trendIcon} ${changeSymbol}${change.toFixed(2)}%
            </div>
            <div style="color: rgba(255,255,255,0.7); font-size: 0.9em;">
                Vol: $${data.volume_24h ? (data.volume_24h / 1000000000).toFixed(1) + 'B' : 'N/A'}
            </div>
        `;
        
        cryptoGrid.appendChild(card);
    });
    
    console.log('✅ Crypto grid updated successfully');
}

// Ask AI function
// Enhanced askAI function with better error handling
async function askAI() {
    const queryInput = document.getElementById('aiQuery');
    const responseDiv = document.getElementById('aiResponse');
    const askBtn = document.getElementById('askBtn');
    
    const question = queryInput.value.trim();
    
    if (!question) {
        responseDiv.innerHTML = `
            <div style="color: #ff6b6b;">
                <i class="fas fa-exclamation-triangle"></i> 
                Please enter a question about crypto markets
            </div>
        `;
        return;
    }
    
    // Show loading state
    askBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    askBtn.disabled = true;
    responseDiv.innerHTML = `
        <div style="color: #4ecdc4;">
            <i class="fas fa-robot"></i> 
            AI is analyzing: "${question}"...
        </div>
    `;
    
    try {
        console.log('🤖 Sending AI query:', question);
        
        const response = await fetch('/api/intelligent-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🧠 AI response received:', data);
        
        // FIX: Better error handling and response rendering
        if (data.error) {
            responseDiv.innerHTML = `
                <div style="color: #ff6b6b;">
                    <i class="fas fa-exclamation-circle"></i> 
                    ${data.message || 'AI analysis failed'}
                </div>
            `;
        } else {
            // IMPROVED: Better response formatting
            const analysis = data.analysis || 'Analysis completed successfully.';
            const queryType = data.queryType || 'unknown';
            const timestamp = new Date(data.timestamp).toLocaleTimeString();
            
            responseDiv.innerHTML = `
                <div style="
        background: rgba(0,0,0,0.8) !important;
        border: 2px solid #4ecdc4 !important;
        border-radius: 10px !important;
        padding: 20px !important;
        margin: 10px 0 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 9999 !important;
        position: relative !important;
    ">
        <div style="color: #4ecdc4 !important; font-weight: bold !important; margin-bottom: 10px !important; font-size: 16px !important;">
            <i class="fas fa-robot"></i> AI Analysis Complete
        </div>
        <div style="color: #ffffff !important; line-height: 1.6 !important; margin-bottom: 15px !important; font-size: 14px !important;">
            ${analysis}
        </div>
        <div style="color: #cccccc !important; font-size: 12px !important;">
            Query type: ${queryType} • ${timestamp}
        </div>
    </div>
            `;
            
            console.log('✅ Response rendered successfully in UI');
        }
        
        // Clear input after successful query
        queryInput.value = '';
        
    } catch (error) {
        console.error('❌ AI query error:', error);
        responseDiv.innerHTML = `
            <div style="color: #ff6b6b;">
                <i class="fas fa-exclamation-circle"></i> 
                Network error: ${error.message}. Please check your connection and try again.
            </div>
        `;
    } finally {
        // Reset button
        askBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        askBtn.disabled = false;
    }
}

// Add this to your script.js for debugging
function testUIRendering() {
    const responseDiv = document.getElementById('aiResponse');
    responseDiv.innerHTML = `
        <div class="ai-success-response">
            <div style="color: #4ecdc4; font-weight: 600; margin-bottom: 10px;">
                <i class="fas fa-robot"></i> AI Analysis Complete
            </div>
            <div style="color: white; line-height: 1.6; margin-bottom: 15px;">
                Market sentiment appears bearish with average 24h change of -3.18%. Bitcoin leads at $117,897.
            </div>
            <div style="font-size: 0.9em; color: rgba(255,255,255,0.7);">
                Query type: coins_markets • Test Response
            </div>
        </div>
    `;
    console.log('✅ Test UI rendering complete');
}

// Run this in browser console to test if UI rendering works
// testUIRendering();


// Quick query function
// Enhanced quick query function
function quickQuery(query) {
    console.log('⚡ Quick query triggered:', query);
    const aiQueryInput = document.getElementById('aiQuery');
    if (aiQueryInput) {
        aiQueryInput.value = query;
        // Trigger the input event to update button state
        aiQueryInput.dispatchEvent(new Event('input'));
        // Execute the query
        askAI();
    }
}


// Refresh data function
async function refreshData() {
    console.log('🔄 Refreshing all data...');
    
    const refreshIcon = document.getElementById('refreshIcon');
    refreshIcon.classList.add('fa-spin');
    
    try {
        const moodData = await fetchMoodData();
        
        if (moodData) {
            currentMoodData = moodData;
            updateMoodRing(moodData);
            updateStats(moodData);
            updateCryptoGrid(moodData.cryptoData);
            updateTimestamp();
            console.log('✅ Data refresh complete');
        } else {
            console.warn('⚠️ No mood data received');
            showErrorState();
        }
    } catch (error) {
        console.error('❌ Refresh failed:', error);
        showErrorState();
    } finally {
        refreshIcon.classList.remove('fa-spin');
    }
}

function showErrorState() {
    document.getElementById('moodText').textContent = 'Error';
    document.getElementById('moodEmoji').textContent = '❌';
    document.getElementById('changeValue').textContent = 'N/A';
    
    const cryptoGrid = document.getElementById('cryptoGrid');
    cryptoGrid.innerHTML = `
        <div class="crypto-loading">
            <p style="color: #ff6b6b;">Failed to load crypto data. Please try refreshing.</p>
        </div>
    `;
}

// Share results function
function shareResults() {
    if (!currentMoodData) {
        alert('Please wait for data to load first!');
        return;
    }
    
    const tweetText = `🔮 AI Crypto Mood Ring Update!

Current Vibe: ${currentMoodData.mood} (${currentMoodData.avgChange}%)
AI Score: ${currentMoodData.moodScore}
Market Volume: $${currentMoodData.totalVolume}

${currentMoodData.description}

#BuildwithCoinGecko #AI #CryptoMood #Innovation

Check it out: ${window.location.href}`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
}

// Toggle auto refresh
function toggleAutoRefresh() {
    const autoBtn = document.getElementById('autoBtn');
    
    if (isAutoRefresh) {
        clearInterval(autoRefreshInterval);
        autoBtn.innerHTML = '<i class="fas fa-play"></i><span>Auto Refresh</span>';
        isAutoRefresh = false;
        console.log('⏸️ Auto refresh stopped');
    } else {
        autoRefreshInterval = setInterval(refreshData, 60000); // 1 minute
        autoBtn.innerHTML = '<i class="fas fa-pause"></i><span>Stop Auto</span>';
        isAutoRefresh = true;
        console.log('▶️ Auto refresh started (60s interval)');
    }
}

// Update timestamp
function updateTimestamp() {
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Handle Enter key in AI query input
document.addEventListener('DOMContentLoaded', function() {
    const aiQueryInput = document.getElementById('aiQuery');
    if (aiQueryInput) {
        aiQueryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                askAI();
            }
        });
    }
});

// Enhanced event listeners for AI chat
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AI Crypto Mood Ring initializing...');
    
    // Initialize the app
    initializeApp();
    
    // Add event listener for AI query input (Enter key)
    const aiQueryInput = document.getElementById('aiQuery');
    if (aiQueryInput) {
        aiQueryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askAI();
            }
        });
        
        // Also add input event for better UX
        aiQueryInput.addEventListener('input', function(e) {
            const askBtn = document.getElementById('askBtn');
            if (e.target.value.trim()) {
                askBtn.style.opacity = '1';
                askBtn.style.cursor = 'pointer';
            } else {
                askBtn.style.opacity = '0.6';
            }
        });
    }
    
    // Add click event listener for ask button
    const askBtn = document.getElementById('askBtn');
    if (askBtn) {
        askBtn.addEventListener('click', function(e) {
            e.preventDefault();
            askAI();
        });
    }
    
    // Ensure quick query buttons work
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const query = this.textContent.includes('BTC') ? 'Bitcoin price' :
                         this.textContent.includes('Trending') ? 'trending coins' :
                         this.textContent.includes('Market') ? 'market overview' : 'Bitcoin price';
            quickQuery(query);
        });
    });
});

