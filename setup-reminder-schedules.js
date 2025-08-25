#!/usr/bin/env node

/**
 * Setup Reminder Schedules
 * Creates default invitation schedules for testing
 */

const http = require('http');

class InvitationSetup {
  constructor() {
    this.eventId = 'demo-event-1';
    this.baseUrl = 'http://localhost:5000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  async makePostRequest(path, data) {
    return new Promise((resolve) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve({ 
              success: res.statusCode >= 200 && res.statusCode < 300, 
              status: res.statusCode,
              data: jsonData 
            });
          } catch (error) {
            resolve({ 
              success: false, 
              status: res.statusCode,
              error: 'Invalid JSON response',
              rawData: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.write(postData);
      req.end();
    });
  }

  async setupInvitationSchedules() {
    this.log('🔧 Setting up Invitation Schedules');
    this.log(`📡 Backend URL: ${this.baseUrl}`);
    this.log(`📋 Event ID: ${this.eventId}`);
    this.log('');

    // Create default invitation schedules
    const defaultSchedules = [
      {
        eventId: this.eventId,
        triggerDays: 30,
        messageTemplate: 'Save the date! You are invited to our wedding on {{eventDate}}. More details to follow. RSVP at {{rsvpLink}}',
        isActive: true,
        scheduleType: 'save_the_date'
      },
      {
        eventId: this.eventId,
        triggerDays: 14,
        messageTemplate: 'Wedding invitation: Join us on {{eventDate}} at {{eventLocation}}. Please RSVP by {{rsvpDeadline}} at {{rsvpLink}}',
        isActive: true,
        scheduleType: 'invitation'
      },
      {
        eventId: this.eventId,
        triggerDays: 7,
        messageTemplate: 'Reminder: Our wedding is in one week! Don\'t forget to RSVP by {{rsvpDeadline}} at {{rsvpLink}}',
        isActive: true,
        scheduleType: 'reminder'
      }
    ];

    try {
      this.log('📝 Creating invitation schedules...');
      
      const result = await this.makePostRequest('/api/invitations/configure', {
        eventId: this.eventId,
        schedules: defaultSchedules
      });

      if (result.success) {
        this.log('✅ Invitation schedules created successfully!');
        this.log(`   Created ${defaultSchedules.length} schedules`);
        this.log(`   Response: ${JSON.stringify(result.data.message)}`);
      } else {
        this.log(`❌ Failed to create invitation schedules`, 'error');
        this.log(`   Status: ${result.status}`, 'error');
        this.log(`   Error: ${result.error || result.data?.error || 'Unknown error'}`, 'error');
        
        if (result.rawData) {
          this.log(`   Raw response: ${result.rawData.substring(0, 200)}`, 'error');
        }
      }

      return result.success;

    } catch (error) {
      this.log(`❌ Setup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testInvitationEndpoints() {
    this.log('');
    this.log('🧪 Testing Invitation Endpoints...');

    const testEndpoints = [
      { path: `/api/invitations/event/${this.eventId}`, name: 'Get Schedules' },
      { path: `/api/invitations/status/${this.eventId}`, name: 'Get Status' },
      { path: `/api/invitations/template/default`, name: 'Get Template' }
    ];

    let allWorking = true;

    for (const endpoint of testEndpoints) {
      try {
        const response = await this.makeGetRequest(endpoint.path);
        
        if (response.success) {
          this.log(`✅ ${endpoint.name}: Working`);
        } else {
          this.log(`❌ ${endpoint.name}: Failed (${response.status})`, 'error');
          allWorking = false;
        }
      } catch (error) {
        this.log(`❌ ${endpoint.name}: Error - ${error.message}`, 'error');
        allWorking = false;
      }
    }

    return allWorking;
  }

  async makeGetRequest(path) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve({ 
              success: res.statusCode >= 200 && res.statusCode < 300, 
              status: res.statusCode,
              data: jsonData 
            });
          } catch (error) {
            resolve({ 
              success: false, 
              status: res.statusCode,
              error: 'Invalid JSON response'
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.end();
    });
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new InvitationSetup();
  
  setup.setupInvitationSchedules()
    .then(async (setupSuccess) => {
      const testSuccess = await setup.testInvitationEndpoints();
      
      console.log('\n' + '='.repeat(50));
      console.log('📋 INVITATION SETUP SUMMARY');
      console.log('='.repeat(50));
      console.log(`Setup: ${setupSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`Testing: ${testSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (setupSuccess && testSuccess) {
        console.log('\n🎉 Invitation management should now work in the web app!');
        console.log('🔄 Refresh your browser to test the invitation management page.');
      } else {
        console.log('\n⚠️ Issues detected. The backend server may need to be restarted.');
        console.log('🔧 Try: npm run dev:backend');
      }
      
      process.exit(setupSuccess && testSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = InvitationSetup;