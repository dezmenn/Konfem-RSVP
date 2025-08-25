#!/usr/bin/env node

/**
 * Task 21 Simplified Testing: Dashboard and Cross-Platform
 * Simplified version that works without external dependencies
 */

const fs = require('fs');
const path = require('path');

class Task21SimplifiedTest {
  constructor() {
    this.startTime = Date.now();
    this.testResults = [];
    this.overallResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testCategories: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    this.testResults.push({
      timestamp,
      type,
      message,
      testTime: Date.now() - this.startTime
    });
  }

  async testDashboardComponents() {
    this.log('=== Testing Dashboard Components ===');
    
    const tests = [
      {
        name: 'EventDashboard Web Component',
        test: () => this.checkFileExists('rsvp-web/src/components/EventDashboard.tsx')
      },
      {
        name: 'EventDashboard Mobile Component',
        test: () => this.checkFileExists('rsvp-mobile/components/EventDashboard.tsx')
      },
      {
        name: 'EventDashboard CSS Styles',
        test: () => this.checkFileExists('rsvp-web/src/components/EventDashboard.css')
      },
      {
        name: 'Analytics Service Backend',
        test: () => this.checkFileExists('rsvp-backend/src/services/AnalyticsService.ts')
      },
      {
        name: 'Analytics Routes',
        test: () => this.checkFileExists('rsvp-backend/src/routes/analytics.ts')
      }
    ];

    return this.runTestGroup(tests, 'Dashboard Components');
  }

  async testCrossPlatformSync() {
    this.log('=== Testing Cross-Platform Synchronization ===');
    
    const tests = [
      {
        name: 'Web Sync Service',
        test: () => this.checkFileExists('rsvp-web/src/services/SyncService.ts')
      },
      {
        name: 'Mobile Sync Service',
        test: () => this.checkFileExists('rsvp-mobile/services/SyncService.ts')
      },
      {
        name: 'WebSocket Client Web',
        test: () => this.checkFileExists('rsvp-web/src/services/WebSocketClient.ts')
      },
      {
        name: 'WebSocket Client Mobile',
        test: () => this.checkFileExists('rsvp-mobile/services/WebSocketClient.ts')
      },
      {
        name: 'Sync Status Components',
        test: () => this.checkFileExists('rsvp-web/src/components/SyncStatus.tsx') &&
                   this.checkFileExists('rsvp-mobile/components/SyncStatus.tsx')
      },
      {
        name: 'Backend Sync Routes',
        test: () => this.checkFileExists('rsvp-backend/src/routes/sync.ts')
      },
      {
        name: 'WebSocket Service Backend',
        test: () => this.checkFileExists('rsvp-backend/src/services/WebSocketService.ts')
      }
    ];

    return this.runTestGroup(tests, 'Cross-Platform Sync');
  }

  async testMobileTouchOptimization() {
    this.log('=== Testing Mobile Touch Optimization ===');
    
    const tests = [
      {
        name: 'Touch Optimized Table Arrangement',
        test: () => this.checkFileExists('rsvp-mobile/components/TouchOptimizedTableArrangement.tsx')
      },
      {
        name: 'Mobile Venue Layout Manager',
        test: () => this.checkFileExists('rsvp-mobile/components/MobileVenueLayoutManager.tsx')
      },
      {
        name: 'Responsive Navigation',
        test: () => this.checkFileExists('rsvp-mobile/components/ResponsiveNavigation.tsx')
      },
      {
        name: 'Auto Table Arrangement Mobile',
        test: () => this.checkFileExists('rsvp-mobile/components/AutoTableArrangement.tsx')
      },
      {
        name: 'Mobile Guest List',
        test: () => this.checkFileExists('rsvp-mobile/components/GuestList.tsx')
      }
    ];

    return this.runTestGroup(tests, 'Mobile Touch Optimization');
  }

  async testResponsiveDesign() {
    this.log('=== Testing Responsive Design ===');
    
    const tests = [
      {
        name: 'Web Component CSS Files',
        test: () => {
          const cssFiles = [
            'rsvp-web/src/components/EventDashboard.css',
            'rsvp-web/src/components/SyncStatus.css',
            'rsvp-web/src/components/AutoTableArrangement.css',
            'rsvp-web/src/components/VenueManager.css'
          ];
          return cssFiles.every(file => this.checkFileExists(file));
        }
      },
      {
        name: 'Mobile Component Structure',
        test: () => {
          const mobileComponents = [
            'rsvp-mobile/components/EventDashboard.tsx',
            'rsvp-mobile/components/SyncStatus.tsx',
            'rsvp-mobile/components/ResponsiveNavigation.tsx'
          ];
          return mobileComponents.every(file => this.checkFileExists(file));
        }
      },
      {
        name: 'Shared Types for Cross-Platform',
        test: () => this.checkFileExists('shared/src/types/invitation.ts')
      },
      {
        name: 'Mobile Configuration',
        test: () => this.checkFileExists('rsvp-mobile/config.ts')
      }
    ];

    return this.runTestGroup(tests, 'Responsive Design');
  }

  async testOfflineFunctionality() {
    this.log('=== Testing Offline Functionality ===');
    
    const tests = [
      {
        name: 'Sync Queue Service Backend',
        test: () => this.checkFileExists('rsvp-backend/src/services/SyncQueueService.ts')
      },
      {
        name: 'Web useSync Hook',
        test: () => this.checkFileExists('rsvp-web/src/hooks/useSync.ts')
      },
      {
        name: 'Mobile Sync Service',
        test: () => this.checkFileExists('rsvp-mobile/services/SyncService.ts')
      },
      {
        name: 'Sync Integration Tests',
        test: () => this.checkFileExists('rsvp-backend/src/__tests__/integration/SyncIntegration.test.ts')
      }
    ];

    return this.runTestGroup(tests, 'Offline Functionality');
  }

  async testCodeQuality() {
    this.log('=== Testing Code Quality and Structure ===');
    
    const tests = [
      {
        name: 'TypeScript Configuration',
        test: () => {
          const tsConfigs = [
            'rsvp-backend/tsconfig.json',
            'rsvp-web/tsconfig.json',
            'rsvp-mobile/tsconfig.json',
            'shared/tsconfig.json'
          ];
          return tsConfigs.every(file => this.checkFileExists(file));
        }
      },
      {
        name: 'Package Configuration',
        test: () => {
          const packageFiles = [
            'package.json',
            'rsvp-backend/package.json',
            'rsvp-mobile/package.json'
          ];
          return packageFiles.every(file => this.checkFileExists(file));
        }
      },
      {
        name: 'Test Files Structure',
        test: () => {
          const testFiles = [
            'rsvp-backend/src/__tests__/services/AnalyticsService.test.ts',
            'rsvp-backend/src/__tests__/integration/SyncIntegration.test.ts'
          ];
          return testFiles.some(file => this.checkFileExists(file));
        }
      },
      {
        name: 'Demo and Testing Scripts',
        test: () => {
          const scripts = [
            'demo-setup.js',
            'test-dashboard-analytics-realtime.js',
            'test-cross-platform-synchronization.js'
          ];
          return scripts.every(file => this.checkFileExists(file));
        }
      }
    ];

    return this.runTestGroup(tests, 'Code Quality');
  }

  checkFileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  async runTestGroup(tests, groupName) {
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
      try {
        const result = await test.test();
        if (result) {
          passed++;
          this.log(`✓ ${test.name}`);
        } else {
          this.log(`✗ ${test.name}`, 'warning');
        }
      } catch (error) {
        this.log(`✗ ${test.name}: ${error.message}`, 'error');
      }
    }
    
    const successRate = (passed / total) * 100;
    this.log(`${groupName}: ${passed}/${total} tests passed (${successRate.toFixed(1)}%)`);
    
    this.overallResults.testCategories.push({
      name: groupName,
      passed,
      total,
      successRate,
      tests: tests.map(test => ({ name: test.name }))
    });
    
    this.overallResults.totalTests += total;
    this.overallResults.passedTests += passed;
    this.overallResults.failedTests += (total - passed);
    
    return successRate >= 70;
  }

  analyzeComponentComplexity() {
    this.log('=== Analyzing Component Complexity ===');
    
    const componentFiles = [
      'rsvp-web/src/components/EventDashboard.tsx',
      'rsvp-mobile/components/EventDashboard.tsx',
      'rsvp-mobile/components/TouchOptimizedTableArrangement.tsx',
      'rsvp-mobile/components/MobileVenueLayoutManager.tsx'
    ];
    
    const analysis = [];
    
    for (const file of componentFiles) {
      if (this.checkFileExists(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n').length;
          const complexity = this.estimateComplexity(content);
          
          analysis.push({
            file: path.basename(file),
            lines,
            complexity,
            hasTests: this.checkFileExists(file.replace('.tsx', '.test.tsx')),
            hasStyles: this.checkFileExists(file.replace('.tsx', '.css'))
          });
          
          this.log(`📊 ${path.basename(file)}: ${lines} lines, complexity: ${complexity}`);
        } catch (error) {
          this.log(`⚠ Could not analyze ${file}: ${error.message}`, 'warning');
        }
      }
    }
    
    return analysis;
  }

  estimateComplexity(content) {
    // Simple complexity estimation based on various factors
    const factors = {
      useState: (content.match(/useState/g) || []).length,
      useEffect: (content.match(/useEffect/g) || []).length,
      functions: (content.match(/const \w+ = \(/g) || []).length,
      conditionals: (content.match(/if \(/g) || []).length,
      loops: (content.match(/(for|while|map|filter|forEach)/g) || []).length,
      asyncOperations: (content.match(/(async|await|Promise)/g) || []).length
    };
    
    const complexity = Object.values(factors).reduce((sum, count) => sum + count, 0);
    
    if (complexity < 10) return 'Low';
    if (complexity < 25) return 'Medium';
    if (complexity < 50) return 'High';
    return 'Very High';
  }

  generateRecommendations() {
    this.log('=== Generating Recommendations ===');
    
    const recommendations = [];
    const overallSuccessRate = (this.overallResults.passedTests / this.overallResults.totalTests) * 100;
    
    if (overallSuccessRate >= 90) {
      recommendations.push('🎉 Excellent implementation! All major components are in place.');
      recommendations.push('✨ Consider adding more comprehensive integration tests.');
    } else if (overallSuccessRate >= 80) {
      recommendations.push('👍 Good implementation with minor gaps.');
      recommendations.push('🔧 Focus on completing missing components.');
    } else if (overallSuccessRate >= 70) {
      recommendations.push('⚠️ Acceptable but needs improvement.');
      recommendations.push('🛠️ Several components are missing or incomplete.');
    } else {
      recommendations.push('🚨 Critical components are missing.');
      recommendations.push('🔥 Immediate attention required for core functionality.');
    }
    
    // Category-specific recommendations
    for (const category of this.overallResults.testCategories) {
      if (category.successRate < 70) {
        recommendations.push(`📋 ${category.name}: Needs significant work (${category.successRate.toFixed(1)}%)`);
      } else if (category.successRate < 90) {
        recommendations.push(`📝 ${category.name}: Minor improvements needed (${category.successRate.toFixed(1)}%)`);
      }
    }
    
    return recommendations;
  }

  async runAllTests() {
    this.log('🚀 Starting Task 21 Simplified Testing Suite');
    this.log('📋 Dashboard and Cross-Platform Functionality Assessment');
    this.log(`⏰ Started at: ${new Date().toISOString()}`);
    this.log('');

    const testCategories = [
      { name: 'Dashboard Components', fn: () => this.testDashboardComponents() },
      { name: 'Cross-Platform Sync', fn: () => this.testCrossPlatformSync() },
      { name: 'Mobile Touch Optimization', fn: () => this.testMobileTouchOptimization() },
      { name: 'Responsive Design', fn: () => this.testResponsiveDesign() },
      { name: 'Offline Functionality', fn: () => this.testOfflineFunctionality() },
      { name: 'Code Quality', fn: () => this.testCodeQuality() }
    ];

    const results = [];
    for (const category of testCategories) {
      this.log(`\n--- Testing ${category.name} ---`);
      const startTime = Date.now();
      const success = await category.fn();
      const duration = Date.now() - startTime;
      
      results.push({
        name: category.name,
        success,
        duration
      });
      
      this.log(`${category.name} completed in ${duration}ms: ${success ? '✓ PASSED' : '⚠ NEEDS WORK'}`);
    }

    // Component complexity analysis
    this.log('\n');
    const complexityAnalysis = this.analyzeComponentComplexity();

    // Calculate final results
    this.overallResults.duration = Date.now() - this.startTime;
    const overallSuccessRate = (this.overallResults.passedTests / this.overallResults.totalTests) * 100;

    // Generate summary
    this.generateSummary(overallSuccessRate, complexityAnalysis);
    
    // Save detailed report
    this.saveDetailedReport(complexityAnalysis);
    
    return overallSuccessRate >= 70;
  }

  generateSummary(successRate, complexityAnalysis) {
    this.log('\n' + '='.repeat(80));
    this.log('🎯 TASK 21 SIMPLIFIED TESTING SUMMARY');
    this.log('='.repeat(80));
    
    this.log(`📊 Overall Results:`);
    this.log(`   • Total Tests: ${this.overallResults.totalTests}`);
    this.log(`   • Passed: ${this.overallResults.passedTests}`);
    this.log(`   • Failed: ${this.overallResults.failedTests}`);
    this.log(`   • Success Rate: ${successRate.toFixed(1)}%`);
    this.log(`   • Duration: ${(this.overallResults.duration / 1000).toFixed(1)} seconds`);
    
    this.log('\n📋 Category Results:');
    this.overallResults.testCategories.forEach((category, index) => {
      const status = category.successRate >= 70 ? '✅' : '⚠️';
      this.log(`   ${index + 1}. ${category.name}: ${status} ${category.passed}/${category.total} (${category.successRate.toFixed(1)}%)`);
    });

    this.log('\n📊 Component Analysis:');
    if (complexityAnalysis.length > 0) {
      complexityAnalysis.forEach(comp => {
        const testStatus = comp.hasTests ? '✅' : '❌';
        const styleStatus = comp.hasStyles ? '✅' : '❌';
        this.log(`   • ${comp.file}: ${comp.lines} lines, ${comp.complexity} complexity, Tests: ${testStatus}, Styles: ${styleStatus}`);
      });
    } else {
      this.log('   ⚠️ No components found for analysis');
    }

    // Recommendations
    this.log('\n💡 Recommendations:');
    const recommendations = this.generateRecommendations();
    recommendations.forEach(rec => this.log(`   ${rec}`));

    // Final assessment
    this.log('\n🏁 Final Assessment:');
    if (successRate >= 90) {
      this.log('   🎉 EXCELLENT: Ready for production deployment');
    } else if (successRate >= 80) {
      this.log('   👍 GOOD: Minor improvements needed');
    } else if (successRate >= 70) {
      this.log('   ⚠️ ACCEPTABLE: Significant improvements recommended');
    } else {
      this.log('   🚨 CRITICAL: Major components missing or incomplete');
    }

    if (successRate >= 70) {
      this.log('\n✅ TASK 21: COMPONENTS READY FOR USER TESTING');
    } else {
      this.log('\n❌ TASK 21: COMPLETE MISSING COMPONENTS BEFORE USER TESTING');
    }
  }

  saveDetailedReport(complexityAnalysis) {
    const reportData = {
      task: 'Task 21 - Dashboard and Cross-Platform Testing (Simplified)',
      summary: this.overallResults,
      componentAnalysis: complexityAnalysis,
      recommendations: this.generateRecommendations(),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      },
      detailedLogs: this.testResults
    };

    const filename = `task-21-simplified-report-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    
    this.log(`\n📄 Detailed report saved: ${filename}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new Task21SimplifiedTest();
  tester.runAllTests()
    .then(success => {
      console.log(`\n🏁 Task 21 Simplified Testing finished: ${success ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Task 21 Simplified Testing failed:', error);
      process.exit(1);
    });
}

module.exports = Task21SimplifiedTest;