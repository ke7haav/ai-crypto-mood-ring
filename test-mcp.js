const mcpBridge = require('./claude-desktop-bridge');

async function testMCPSetup() {
    console.log('🧪 Testing Claude Desktop MCP Setup...\n');
    
    // Test configuration
    console.log('1. Checking Claude config...');
    const configValid = mcpBridge.checkClaudeConfig();
    
    // Test process detection  
    console.log('\n2. Checking Claude Desktop process...');
    const isRunning = await mcpBridge.checkClaudeDesktop();
    
    // Test MCP logs
    console.log('\n3. Checking MCP activity...');
    const mcpActive = await mcpBridge.checkMCPStatus();
    
    console.log('\n📊 Setup Summary:');
    console.log(`   Config Valid: ${configValid ? '✅' : '❌'}`);
    console.log(`   Process Running: ${isRunning ? '✅' : '❌'}`);
    console.log(`   MCP Activity: ${mcpActive ? '✅' : '❌'}`);
    
    if (configValid && isRunning) {
        console.log('\n🎉 Your setup looks good! Ready for MCP integration.');
    } else {
        console.log('\n⚠️ Some issues detected. Check the output above.');
    }
}

testMCPSetup().catch(console.error);
