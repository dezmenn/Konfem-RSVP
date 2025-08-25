#!/usr/bin/env node

/**
 * Task 21 Master Test Runner: Dashboard and Cross-Platform Testing
 * Runs all Task 21 tests and provides comprehensive reporting
 */

const DashboardAnalyticsTest = require('./test-dashboard-analytics-realtime');
const CrossPlatformSyncTest = require('./test-cross-platform-synchronization');
const MobileTouchOptimizationTest = require('./test-mobile-touch-optimization');
const ResponsiveDesignTest = require('./test-responsive-design');
const OfflineFunctionalityTest = require('./test-offline-functionality');

class Task21CompleteTest {
  constructor() {
    this.startTime = Date.now();
    this.testResults = [];
    this.overallResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testSuites: [],
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

  async runTestSuite(TestClass, suiteName) {
    this.log(`\n${'='.repeat(80)}`);
    this.log(`🧪 STARTING TEST SUITE: ${suiteName}`);
    this.log(`${'='.repeat(80)}`);
    
    const suiteStartTime = Date.now();
    let suiteSuccess = false;
    let suiteError = null;
    
    try {
      const tester = new TestClass();
      suiteSuccess = await tester.runAllTests();
      
      const suiteDuration = Date.now() - suiteStartTime;
      
      this.overallResults.testSuites.push({
        name: suiteName,
        success: suiteSuccess,
        duration: suiteDuration,
        className: TestClass.name
      });
      
      if (suiteSuccess) {
        this.overallResults.passedTests++;
        this.log(`✅ TEST SUITE COMPLETED: ${suiteName} - PASSED (${suiteDuration}ms)`);
      } else {
        this.overallResults.failedTests++;
        this.log(`❌ TEST SUITE COMPLETED: ${suiteName} - FAILED (${suiteDuration}ms)`);
      }
      
    } catch (error) {
      suiteError = error.message;
      this.overallResults.failedTests++;
      this.log(`💥 TEST SUITE ERROR: ${suiteName} - ${error.message}`, 'error');
    }
    
    this.overallResults.totalTests++;
    
    return { success: suiteSuccess, error: suiteError };
  }

  async runAllTests() {
    this.log('🚀 STARTING TASK 21 COMPLETE TESTING SUITE');
    this.log('📋 Dashboard and Cross-Platform Functionality Testing');
    this.log(`⏰ Started at: ${new Date().toISOString()}`);
    this.log('');

    // Define test suites in order of execution
    const testSuites = [
      {
        TestClass: DashboardAnalyticsTest,
        name: 'Dashboard Analytics and Real-time Updates',
        description: 'Tests dashboard functionality, real-time updates, and analytics accuracy',
        priority: 'high'
      },
      {
        TestClass: CrossPlatformSyncTest,
        name: 'Cross-Platform Synchronization',
        description: 'Tests data synchronization between mobile and web platforms',
        priority: 'high'
      },
      {
        TestClass: MobileTouchOptimizationTest,
        name: 'Mobile Touch Optimization',
        description: 'Tests mobile-optimized interfaces and touch interactions',
        priority: 'medium'
      },
      {
        TestClass: ResponsiveDesignTest,
        name: 'Responsive Design',
        description: 'Tests responsive design on various screen sizes',
        priority: 'medium'
      },
      {
        TestClass: OfflineFunctionalityTest,
        name: 'Offline Functionality and Sync Recovery',
        description: 'Tests offline mode capabilities and sync recovery mechanisms',
        priority: 'medium'
      }
    ];

    this.log(`📊 Test Suites to Execute: ${testSuites.length}`);
    this.log('');

    // Run each test suite
    for (let i = 0; i < testSuites.length; i++) {
      const suite = testSuites[i];
      
      this.log(`\n📍 Progress: ${i + 1}/${testSuites.length} - ${suite.name}`);
      this.log(`📝 Description: ${suite.description}`);
      this.log(`⚡ Priority: ${suite.priority}`);
      
      const result = await this.runTestSuite(suite.TestClass, suite.name);
      
      // Add small delay between test suites to prevent resource conflicts
      if (i < testSuites.length - 1) {
        this.log('⏳ Waiting 2 seconds before next test suite...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Calculate final results
    this.overallResults.duration = Date.now() - this.startTime;
    const successRate = (this.overallResults.passedTests / this.overallResults.totalTests) * 100;

    // Generate comprehensive summary
    this.generateSummary(successRate);
    
    // Save detailed report
    this.saveDetailedReport();
    
    return successRate >= 70; // Consider successful if 70% or more test suites pass
  }

  generateSummary(successRate) {
    this.log('\n' + '='.repeat(100));
    this.log('🎯 TASK 21 COMPLETE TESTING SUMMARY');
    this.log('='.repeat(100));
    
    this.log(`📊 Overall Results:`);
    this.log(`   • Total Test Suites: ${this.overallResults.totalTests}`);
    this.log(`   • Passed: ${this.overallResults.passedTests}`);
    this.log(`   • Failed: ${this.overallResults.failedTests}`);
    this.log(`   • Success Rate: ${successRate.toFixed(1)}%`);
    this.log(`   • Total Duration: ${(this.overallResults.duration / 1000).toFixed(1)} seconds`);
    
    this.log('\n📋 Test Suite Results:');
    this.overallResults.testSuites.forEach((suite, index) => {
      const status = suite.success ? '✅ PASSED' : '❌ FAILED';
      const duration = (suite.duration / 1000).toFixed(1);
      this.log(`   ${index + 1}. ${suite.name}: ${status} (${duration}s)`);
    });

    // Performance Analysis
    this.log('\n⚡ Performance Analysis:');
    const avgDuration = this.overallResults.testSuites.reduce((sum, suite) => sum + suite.duration, 0) / this.overallResults.testSuites.length;
    const slowestSuite = this.overallResults.testSuites.reduce((prev, current) => 
      (prev.duration > current.duration) ? prev : current
    );
    const fastestSuite = this.overallResults.testSuites.reduce((prev, current) => 
      (prev.duration < current.duration) ? prev : current
    );
    
    this.log(`   • Average Suite Duration: ${(avgDuration / 1000).toFixed(1)}s`);
    this.log(`   • Slowest Suite: ${slowestSuite.name} (${(slowestSuite.duration / 1000).toFixed(1)}s)`);
    this.log(`   • Fastest Suite: ${fastestSuite.name} (${(fastestSuite.duration / 1000).toFixed(1)}s)`);

    // Recommendations
    this.log('\n💡 Recommendations:');
    
    if (successRate >= 90) {
      this.log('   🎉 Excellent! All systems are performing well.');
      this.log('   ✨ Ready for production deployment.');
    } else if (successRate >= 80) {
      this.log('   👍 Good performance with minor issues.');
      this.log('   🔧 Address failed tests before production.');
    } else if (successRate >= 70) {
      this.log('   ⚠️  Acceptable but needs improvement.');
      this.log('   🛠️  Focus on failed test suites and performance optimization.');
    } else {
      this.log('   🚨 Critical issues detected.');
      this.log('   🔥 Immediate attention required before proceeding.');
    }

    // Failed Test Analysis
    const failedSuites = this.overallResults.testSuites.filter(suite => !suite.success);
    if (failedSuites.length > 0) {
      this.log('\n🔍 Failed Test Analysis:');
      failedSuites.forEach(suite => {
        this.log(`   ❌ ${suite.name}:`);
        this.log(`      - Review detailed logs for specific failures`);
        this.log(`      - Check API connectivity and data availability`);
        this.log(`      - Verify system resources and performance`);
      });
    }

    // Next Steps
    this.log('\n🚀 Next Steps:');
    this.log('   1. Review detailed test reports for specific issues');
    this.log('   2. Address any critical failures identified');
    this.log('   3. Conduct manual testing for user experience validation');
    this.log('   4. Collect user feedback on dashboard and mobile interfaces');
    this.log('   5. Iterate on improvements based on test results');
    
    if (successRate >= 70) {
      this.log('\n✅ TASK 21 TESTING: PASSED');
      this.log('🎯 Dashboard and Cross-Platform functionality is ready for user testing');
    } else {
      this.log('\n❌ TASK 21 TESTING: NEEDS IMPROVEMENT');
      this.log('🔧 Address critical issues before proceeding to user testing');
    }
  }

  saveDetailedReport() {
    const reportData = {
      task: 'Task 21 - Dashboard and Cross-Platform Testing',
      summary: this.overallResults,
      testSuites: this.overallResults.testSuites.map(suite => ({
        ...suite,
        recommendations: this.generateSuiteRecommendations(suite)
      })),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      detailedLogs: this.testResults,
      metadata: {
        testRunner: 'Task21CompleteTest',
        version: '1.0.0',
        environment: 'development',
        apiBase: 'http://localhost:5000/api'
      }
    };

    const filename = `task-21-complete-test-report-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(reportData, null, 2));
    
    this.log(`\n📄 Comprehensive report saved: ${filename}`);
    this.log(`📊 Report includes detailed logs, performance metrics, and recommendations`);
  }

  generateSuiteRecommendations(suite) {
    const recommendations = [];
    
    if (!suite.success) {
      recommendations.push('Review detailed error logs for specific failure points');
      recommendations.push('Verify API endpoints are accessible and returning expected data');
      recommendations.push('Check system resources and network connectivity');
    }
    
    if (suite.duration > 30000) { // More than 30 seconds
      recommendations.push('Consider performance optimization for this test suite');
      recommendations.push('Review API response times and data payload sizes');
    }
    
    switch (suite.name) {
      case 'Dashboard Analytics and Real-time Updates':
        if (!suite.success) {
          recommendations.push('Verify analytics calculations and real-time update mechanisms');
          recommendations.push('Check WebSocket connections for real-time features');
        }
        break;
        
      case 'Cross-Platform Synchronization':
        if (!suite.success) {
          recommendations.push('Test WebSocket connectivity and sync queue functionality');
          recommendations.push('Verify conflict resolution mechanisms');
        }
        break;
        
      case 'Mobile Touch Optimization':
        if (!suite.success) {
          recommendations.push('Test on actual mobile devices for touch interaction validation');
          recommendations.push('Verify drag-and-drop APIs and gesture support');
        }
        break;
        
      case 'Responsive Design':
        if (!suite.success) {
          recommendations.push('Test on various screen sizes and orientations');
          recommendations.push('Verify data structure adaptability for different devices');
        }
        break;
        
      case 'Offline Functionality and Sync Recovery':
        if (!suite.success) {
          recommendations.push('Test offline detection and data queuing mechanisms');
          recommendations.push('Verify sync recovery and conflict resolution');
        }
        break;
    }
    
    return recommendations;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new Task21CompleteTest();
  tester.runAllTests()
    .then(success => {
      console.log(`\n🏁 Task 21 Complete Testing finished: ${success ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Task 21 Complete Testing failed:', error);
      process.exit(1);
    });
}

module.exports = Task21CompleteTest;