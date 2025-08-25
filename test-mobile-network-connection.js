#!/usr/bin/env node

/**
 * Test Mobile Network Connection
 * Verifies that the backend server is accessible for mobile app
 */

const http = require('http');

class MobileNetworkTester {
  constructor() {
    this.testUrls = [
      { url: 'http://localhost:5000/health', name: 'Health Check' },
      { url: 'http://localhost:5000/api', name: 'API Root' },
      { url: 'http://localhost:5000/api/guests/events/demo-event-1', name: 'Guests API' },
      { url: 'http://localhost:5000/api/analytics/events/demo-event-1', name: 'Analytics API' },
      { url: 'http://localhost:5000/api/invitations/status/demo-event-1', name: 'Invitations API' }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  async testEndpoint(url, name) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = http.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            this.log(`✅ ${name}: OK (${res.statusCode}) - ${responseTime}ms`);
            resolve({ success: true, status: res.statusCode, responseTime, data: data.substring(0, 100) });
          } else {
            this.log(`⚠️ ${name}: HTTP ${res.statusCode} - ${responseTime}ms`, 'warning');
            resolve({ success: false, status: res.statusCode, responseTime, error: `HTTP ${res.statusCode}` });
          }
        });
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        this.log(`❌ ${name}: ${error.message} - ${responseTime}ms`, 'error');
        resolve({ success: false, status: 0, responseTime, error: error.message });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        this.log(`⏰ ${name}: Timeout - ${responseTime}ms`, 'error');
        resolve({ success: false, status: 0, responseTime, error: 'Timeout' });
      });
    });
  }

  async runNetworkTests() {
    this.log('🔍 Testing Mobile Network Connection');
    this.log('📡 Checking backend API accessibility...');
    this.log('');

    const results = [];
    
    for (const test of this.testUrls) {
      const result = await this.testEndpoint(test.url, test.name);
      results.push({ ...result, name: test.name, url: test.url });
    }

    // Summary
    this.log('');
    this.log('='.repeat(60));
    this.log('📊 NETWORK TEST SUMMARY');
    this.log('='.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = (successful / total) * 100;
    
    this.log(`✅ Successful: ${successful}/${total} (${successRate.toFixed(1)}%)`);
    this.log(`⏱️ Average response time: ${Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / total)}ms`);
    
    this.log('');
    this.log('📋 Detailed Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      this.log(`   ${status} ${result.name}: ${result.error || 'OK'} (${result.responseTime}ms)`);
    });

    // Recommendations
    this.log('');
    this.log('💡 Recommendations:');
    
    if (successful === 0) {
      this.log('   🚨 CRITICAL: Backend server is not running!');
      this.log('   🔧 Action: Start the backend server with: npm run dev:backend');
      this.log('   📍 Verify: Visit http://localhost:5000/api/health in your browser');
    } else if (successful < total) {
      this.log('   ⚠️ Some endpoints are not accessible');
      this.log('   🔧 Action: Check backend server logs for errors');
      this.log('   📍 Verify: Ensure demo data is loaded');
    } else {
      this.log('   🎉 All endpoints accessible!');
      this.log('   📱 Mobile app should now connect successfully');
      this.log('   🔄 Action: Restart your Expo development server');
    }

    // Mobile-specific instructions
    this.log('');
    this.log('📱 Mobile App Instructions:');
    this.log('   1. Ensure backend is running (see results above)');
    this.log('   2. Restart Expo development server: npm run dev:mobile');
    this.log('   3. For Android emulator: App will use http://10.0.2.2:5000');
    this.log('   4. For iOS simulator: App will use http://localhost:5000');
    this.log('   5. Check mobile app console for connection success');

    return successful === total;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MobileNetworkTester();
  tester.runNetworkTests()
    .then(success => {
      console.log(`\n🏁 Network test completed: ${success ? 'ALL ENDPOINTS ACCESSIBLE' : 'ISSUES DETECTED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Network test failed:', error);
      process.exit(1);
    });
}

module.exports = MobileNetworkTester;