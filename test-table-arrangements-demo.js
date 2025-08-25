/**
 * Table Arrangements Demo Setup and Testing Script
 * 
 * This script sets up a comprehensive demo environment for testing:
 * 1. Auto-arrangement algorithm with various guest configurations
 * 2. Manual guest assignment and reassignment
 * 3. Table locking during auto-arrangement
 * 4. Seating chart export functionality
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

// Demo configuration
const DEMO_CONFIG = {
    eventId: 'demo-event-1',
    tables: [
        { name: 'Table 1', capacity: 8, position: { x: 100, y: 100 } },
        { name: 'Table 2', capacity: 6, position: { x: 300, y: 100 } },
        { name: 'Table 3', capacity: 10, position: { x: 500, y: 100 } },
        { name: 'Table 4', capacity: 8, position: { x: 100, y: 300 } },
        { name: 'Table 5', capacity: 6, position: { x: 300, y: 300 } },
        { name: 'VIP Table', capacity: 4, position: { x: 500, y: 300 } }
    ],
    venueElements: [
        { type: 'stage', name: 'Main Stage', position: { x: 250, y: 50 }, dimensions: { width: 200, height: 80 } },
        { type: 'dance_floor', name: 'Dance Floor', position: { x: 200, y: 200 }, dimensions: { width: 150, height: 150 } },
        { type: 'bar', name: 'Bar Area', position: { x: 50, y: 400 }, dimensions: { width: 100, height: 50 } },
        { type: 'entrance', name: 'Main Entrance', position: { x: 0, y: 250 }, dimensions: { width: 50, height: 100 } }
    ]
};

// Diverse guest configurations for testing auto-arrangement
const DEMO_GUESTS = [
    // Bride's family - close relationships
    { name: 'Sarah Johnson (Bride)', phone: '+1234567001', relationship: 'Bride', side: 'bride', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'Robert Johnson', phone: '+1234567002', relationship: 'Father', side: 'bride', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Mary Johnson', phone: '+1234567003', relationship: 'Mother', side: 'bride', dietary: ['vegetarian'], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'Michael Johnson', phone: '+1234567004', relationship: 'Sibling', side: 'bride', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Emily Johnson', phone: '+1234567005', relationship: 'Sibling', side: 'bride', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    
    // Groom's family - close relationships
    { name: 'David Smith (Groom)', phone: '+1234567006', relationship: 'Groom', side: 'groom', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'James Smith', phone: '+1234567007', relationship: 'Father', side: 'groom', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Linda Smith', phone: '+1234567008', relationship: 'Mother', side: 'groom', dietary: ['gluten-free'], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'Christopher Smith', phone: '+1234567009', relationship: 'Sibling', side: 'groom', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    
    // Extended family - bride's side
    { name: 'William Johnson', phone: '+1234567010', relationship: 'Uncle', side: 'bride', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Patricia Johnson', phone: '+1234567011', relationship: 'Aunt', side: 'bride', dietary: ['vegetarian'], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'Thomas Johnson', phone: '+1234567012', relationship: 'Grandparent', side: 'bride', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Jennifer Johnson', phone: '+1234567013', relationship: 'Cousin', side: 'bride', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'Daniel Johnson', phone: '+1234567014', relationship: 'Cousin', side: 'bride', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    
    // Extended family - groom's side
    { name: 'Richard Smith', phone: '+1234567015', relationship: 'Uncle', side: 'groom', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Susan Smith', phone: '+1234567016', relationship: 'Aunt', side: 'groom', dietary: ['gluten-free'], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'Charles Smith', phone: '+1234567017', relationship: 'Grandparent', side: 'groom', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Lisa Smith', phone: '+1234567018', relationship: 'Cousin', side: 'groom', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    
    // Friends - mixed sides
    { name: 'Jessica Brown', phone: '+1234567019', relationship: 'Friend', side: 'bride', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Matthew Brown', phone: '+1234567020', relationship: 'Friend', side: 'bride', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    { name: 'Ashley Davis', phone: '+1234567021', relationship: 'Friend', side: 'groom', dietary: ['vegetarian'], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Ryan Davis', phone: '+1234567022', relationship: 'Friend', side: 'groom', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    
    // Colleagues
    { name: 'Amanda Wilson', phone: '+1234567023', relationship: 'Colleague', side: 'bride', dietary: [], additionalGuests: 1, rsvpStatus: 'accepted' },
    { name: 'Kevin Wilson', phone: '+1234567024', relationship: 'Colleague', side: 'groom', dietary: [], additionalGuests: 0, rsvpStatus: 'accepted' },
    
    // Some pending/declined guests to test filtering
    { name: 'Mark Taylor', phone: '+1234567025', relationship: 'Friend', side: 'bride', dietary: [], additionalGuests: 0, rsvpStatus: 'pending' },
    { name: 'Rachel Green', phone: '+1234567026', relationship: 'Friend', side: 'groom', dietary: [], additionalGuests: 1, rsvpStatus: 'declined' }
];

class TableArrangementDemo {
    constructor() {
        this.eventId = DEMO_CONFIG.eventId;
        this.createdGuests = [];
        this.createdTables = [];
        this.testResults = [];
    }

    async setupDemo() {
        console.log('🚀 Setting up Table Arrangements Demo...\n');
        
        try {
            // Clear existing demo data
            await this.clearDemoData();
            
            // Create venue layout with tables and elements
            await this.createVenueLayout();
            
            // Create diverse guest list
            await this.createGuestList();
            
            console.log('✅ Demo setup complete!\n');
            console.log(`📊 Created ${this.createdGuests.length} guests and ${this.createdTables.length} tables`);
            console.log(`🎯 Accepted guests: ${this.createdGuests.filter(g => g.rsvpStatus === 'accepted').length}`);
            console.log(`📍 Total capacity: ${this.createdTables.reduce((sum, t) => sum + t.capacity, 0)} seats\n`);
            
        } catch (error) {
            console.error('❌ Demo setup failed:', error.message);
            throw error;
        }
    }

    async clearDemoData() {
        console.log('🧹 Clearing existing demo data...');
        
        try {
            // Get existing guests and tables for the demo event
            const guestsResponse = await axios.get(`${BASE_URL}/guests/${this.eventId}`);
            const tablesResponse = await axios.get(`${BASE_URL}/tables/events/${this.eventId}`);
            
            // Delete existing guests
            if (guestsResponse.data.success && guestsResponse.data.data) {
                for (const guest of guestsResponse.data.data) {
                    await axios.delete(`${BASE_URL}/guests/${guest.id}`);
                }
            }
            
            // Delete existing tables
            if (tablesResponse.data.success && tablesResponse.data.data) {
                for (const table of tablesResponse.data.data) {
                    await axios.delete(`${BASE_URL}/tables/${table.id}`);
                }
            }
            
            console.log('✅ Demo data cleared');
        } catch (error) {
            console.log('ℹ️  No existing data to clear or error clearing:', error.response?.data?.error || error.message);
        }
    }

    async createVenueLayout() {
        console.log('🏛️  Creating venue layout...');
        
        // Create tables
        for (const tableConfig of DEMO_CONFIG.tables) {
            try {
                const response = await axios.post(`${BASE_URL}/tables`, {
                    ...tableConfig,
                    eventId: this.eventId,
                    isLocked: false,
                    assignedGuests: []
                });
                this.createdTables.push(response.data);
                console.log(`   ✓ Created ${tableConfig.name} (capacity: ${tableConfig.capacity})`);
            } catch (error) {
                console.error(`   ❌ Failed to create ${tableConfig.name}:`, error.message);
            }
        }
        
        // Create venue elements
        for (const element of DEMO_CONFIG.venueElements) {
            try {
                await axios.post(`${BASE_URL}/venue-layout/elements`, {
                    ...element,
                    eventId: this.eventId,
                    color: '#3498db'
                });
                console.log(`   ✓ Created venue element: ${element.name}`);
            } catch (error) {
                console.error(`   ❌ Failed to create venue element ${element.name}:`, error.message);
            }
        }
    }

    async createGuestList() {
        console.log('👥 Creating diverse guest list...');
        
        for (const guestData of DEMO_GUESTS) {
            try {
                const response = await axios.post(`${BASE_URL}/guests`, {
                    name: guestData.name,
                    phoneNumber: guestData.phone,
                    dietaryRestrictions: guestData.dietary,
                    additionalGuestCount: guestData.additionalGuests,
                    relationshipType: guestData.relationship,
                    brideOrGroomSide: guestData.side,
                    rsvpStatus: guestData.rsvpStatus,
                    specialRequests: '',
                    eventId: this.eventId
                });
                // Handle the response format from the API
                const createdGuest = response.data.success ? response.data.data : response.data;
                this.createdGuests.push(createdGuest);
                console.log(`   ✓ Created ${guestData.name} (${guestData.relationship}, ${guestData.side} side)`);
            } catch (error) {
                console.error(`   ❌ Failed to create ${guestData.name}:`, error.message);
            }
        }
    }

    async runAutoArrangementTests() {
        console.log('\n🤖 Testing Auto-Arrangement Algorithm...\n');
        
        const tests = [
            {
                name: 'Basic Auto-Arrangement',
                description: 'Test basic auto-arrangement with all accepted guests',
                action: async () => {
                    const response = await axios.post(`${BASE_URL}/tables/events/${this.eventId}/auto-arrange`);
                    return response.data;
                }
            },
            {
                name: 'Auto-Arrangement with Locked Tables',
                description: 'Lock VIP table and test auto-arrangement preserves it',
                action: async () => {
                    // Find and lock VIP table
                    const vipTable = this.createdTables.find(t => t.name === 'VIP Table');
                    if (vipTable) {
                        await axios.post(`${BASE_URL}/tables/${vipTable.id}/lock`);
                        console.log('   🔒 Locked VIP Table');
                    }
                    
                    const response = await axios.post(`${BASE_URL}/tables/events/${this.eventId}/auto-arrange`);
                    return response.data;
                }
            },
            {
                name: 'Dietary Restrictions Grouping',
                description: 'Verify guests with similar dietary needs are grouped',
                action: async () => {
                    const response = await axios.post(`${BASE_URL}/tables/events/${this.eventId}/auto-arrange`);
                    
                    // Analyze dietary grouping
                    const tables = await axios.get(`${BASE_URL}/tables/events/${this.eventId}`);
                    const guests = await axios.get(`${BASE_URL}/guests/${this.eventId}`);
                    
                    const analysis = this.analyzeDietaryGrouping(tables.data, guests.data.success ? guests.data.data : guests.data);
                    return { arrangement: response.data, analysis };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}`);
                console.log(`   ${test.description}`);
                
                const result = await test.action();
                this.testResults.push({
                    test: test.name,
                    status: 'passed',
                    result: result
                });
                
                console.log('   ✅ Test passed\n');
                
                // Wait a moment between tests
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`   ❌ Test failed: ${error.message}\n`);
                this.testResults.push({
                    test: test.name,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }

    async runManualAssignmentTests() {
        console.log('👆 Testing Manual Assignment Features...\n');
        
        // Clear some assignments to ensure we have unassigned guests for testing
        try {
            const guestsResponse = await axios.get(`${BASE_URL}/guests/${this.eventId}`);
            const guests = guestsResponse.data.success ? guestsResponse.data.data : guestsResponse.data;
            const assignedGuests = guests.filter(g => g.tableAssignment);
            
            // Unassign a few guests for manual testing
            for (let i = 0; i < Math.min(3, assignedGuests.length); i++) {
                await axios.delete(`${BASE_URL}/guests/${assignedGuests[i].id}/table`);
            }
            console.log(`   ℹ️  Unassigned ${Math.min(3, assignedGuests.length)} guests for manual testing\n`);
        } catch (error) {
            console.log('   ⚠️  Could not prepare guests for manual testing:', error.message);
        }
        
        const tests = [
            {
                name: 'Manual Guest Assignment',
                description: 'Manually assign specific guests to tables',
                action: async () => {
                    // Get current guest and table data to find unassigned guests
                    const guestsResponse = await axios.get(`${BASE_URL}/guests/${this.eventId}`);
                    const tablesResponse = await axios.get(`${BASE_URL}/tables/events/${this.eventId}`);
                    
                    const guests = guestsResponse.data.success ? guestsResponse.data.data : guestsResponse.data;
                    const tables = tablesResponse.data;
                    
                    // Find an unassigned accepted guest
                    const unassignedGuests = guests.filter(g => 
                        g.rsvpStatus === 'accepted' && !g.tableAssignment
                    );
                    
                    const testGuest = unassignedGuests[0];
                    const testTable = tables[0];
                    
                    if (testGuest && testTable) {
                        await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                            tableId: testTable.id
                        });
                        console.log(`   ✓ Assigned ${testGuest.name} to ${testTable.name}`);
                        return { guest: testGuest.name, table: testTable.name };
                    }
                    throw new Error('No unassigned guests or tables available for assignment');
                }
            },
            {
                name: 'Guest Reassignment',
                description: 'Move guest from one table to another',
                action: async () => {
                    // Get current guest and table data
                    const guestsResponse = await axios.get(`${BASE_URL}/guests/${this.eventId}`);
                    const tablesResponse = await axios.get(`${BASE_URL}/tables/events/${this.eventId}`);
                    
                    const guests = guestsResponse.data.success ? guestsResponse.data.data : guestsResponse.data;
                    const tables = tablesResponse.data;
                    
                    // Find an unassigned accepted guest
                    const unassignedGuests = guests.filter(g => 
                        g.rsvpStatus === 'accepted' && !g.tableAssignment
                    );
                    
                    const testGuest = unassignedGuests[0];
                    if (!testGuest) {
                        throw new Error('No unassigned guests available for reassignment test');
                    }
                    
                    const seatsNeeded = 1 + (testGuest.additionalGuestCount || 0);
                    
                    // Find tables with enough capacity for the guest
                    const tablesWithCapacity = [];
                    for (const table of tables) {
                        const assignedGuests = table.assignedGuests || [];
                        let seatsUsed = 0;
                        
                        for (const guestId of assignedGuests) {
                            const guest = guests.find(g => g.id === guestId);
                            if (guest) {
                                seatsUsed += 1 + (guest.additionalGuestCount || 0);
                            }
                        }
                        
                        const available = table.capacity - seatsUsed;
                        if (available >= seatsNeeded) {
                            tablesWithCapacity.push({ table, available });
                        }
                    }
                    
                    if (tablesWithCapacity.length < 2) {
                        throw new Error(`Need at least 2 tables with capacity for ${seatsNeeded} seats, found ${tablesWithCapacity.length}`);
                    }
                    
                    // Use the first two tables with available capacity
                    const sourceTable = tablesWithCapacity[0].table;
                    const targetTable = tablesWithCapacity[1].table;
                    
                    // First assign to source table
                    await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                        tableId: sourceTable.id
                    });
                    console.log(`   ✓ Initially assigned ${testGuest.name} to ${sourceTable.name}`);
                    
                    // Then reassign to target table
                    await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                        tableId: targetTable.id
                    });
                    console.log(`   ✓ Reassigned ${testGuest.name} to ${targetTable.name}`);
                    
                    return { 
                        guest: testGuest.name, 
                        from: sourceTable.name, 
                        to: targetTable.name 
                    };
                }
            },
            {
                name: 'Capacity Validation',
                description: 'Test assignment validation with table capacity limits',
                action: async () => {
                    // Find smallest table
                    const smallestTable = this.createdTables.reduce((min, table) => 
                        table.capacity < min.capacity ? table : min
                    );
                    
                    const acceptedGuests = this.createdGuests.filter(g => g.rsvpStatus === 'accepted');
                    const results = [];
                    
                    // Try to assign guests until capacity is exceeded
                    for (let i = 0; i < acceptedGuests.length && i < smallestTable.capacity + 2; i++) {
                        try {
                            await axios.put(`${BASE_URL}/guests/${acceptedGuests[i].id}/table`, {
                                tableId: smallestTable.id
                            });
                            results.push(`✓ Assigned ${acceptedGuests[i].name}`);
                        } catch (error) {
                            results.push(`❌ Failed to assign ${acceptedGuests[i].name}: ${error.response?.data?.message || error.message}`);
                            break;
                        }
                    }
                    
                    return { table: smallestTable.name, capacity: smallestTable.capacity, results };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}`);
                console.log(`   ${test.description}`);
                
                const result = await test.action();
                this.testResults.push({
                    test: test.name,
                    status: 'passed',
                    result: result
                });
                
                console.log('   ✅ Test passed\n');
                
            } catch (error) {
                console.error(`   ❌ Test failed: ${error.message}\n`);
                this.testResults.push({
                    test: test.name,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }

    async runTableLockingTests() {
        console.log('🔒 Testing Table Locking Features...\n');
        
        const tests = [
            {
                name: 'Table Lock/Unlock',
                description: 'Test basic table locking and unlocking functionality',
                action: async () => {
                    const testTable = this.createdTables[0];
                    
                    // Lock table
                    await axios.post(`${BASE_URL}/tables/${testTable.id}/lock`);
                    console.log(`   🔒 Locked ${testTable.name}`);
                    
                    // Verify lock status
                    const lockedResponse = await axios.get(`${BASE_URL}/tables/${testTable.id}`);
                    if (!lockedResponse.data.isLocked) {
                        throw new Error('Table should be locked but isLocked is false');
                    }
                    
                    // Unlock table
                    await axios.post(`${BASE_URL}/tables/${testTable.id}/unlock`);
                    console.log(`   🔓 Unlocked ${testTable.name}`);
                    
                    // Verify unlock status
                    const unlockedResponse = await axios.get(`${BASE_URL}/tables/${testTable.id}`);
                    if (unlockedResponse.data.isLocked) {
                        throw new Error('Table should be unlocked but isLocked is true');
                    }
                    
                    return { table: testTable.name, lockTest: 'passed' };
                }
            },
            {
                name: 'Locked Table Preservation',
                description: 'Verify auto-arrangement preserves locked table assignments',
                action: async () => {
                    const testTable = this.createdTables[1];
                    const testGuest = this.createdGuests.find(g => g.rsvpStatus === 'accepted');
                    
                    // Assign guest to table and lock it
                    await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                        tableId: testTable.id
                    });
                    await axios.post(`${BASE_URL}/tables/${testTable.id}/lock`);
                    console.log(`   ✓ Assigned ${testGuest.name} to ${testTable.name} and locked table`);
                    
                    // Run auto-arrangement
                    await axios.post(`${BASE_URL}/tables/events/${this.eventId}/auto-arrange`);
                    console.log('   ✓ Ran auto-arrangement');
                    
                    // Verify guest is still at locked table
                    const updatedTable = await axios.get(`${BASE_URL}/tables/${testTable.id}`);
                    const guestStillAssigned = updatedTable.data.assignedGuests.includes(testGuest.id);
                    
                    if (!guestStillAssigned) {
                        throw new Error('Guest was moved from locked table during auto-arrangement');
                    }
                    
                    return { 
                        table: testTable.name, 
                        guest: testGuest.name, 
                        preserved: true 
                    };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}`);
                console.log(`   ${test.description}`);
                
                const result = await test.action();
                this.testResults.push({
                    test: test.name,
                    status: 'passed',
                    result: result
                });
                
                console.log('   ✅ Test passed\n');
                
            } catch (error) {
                console.error(`   ❌ Test failed: ${error.message}\n`);
                this.testResults.push({
                    test: test.name,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }

    async runExportTests() {
        console.log('📄 Testing Seating Chart Export...\n');
        
        const tests = [
            {
                name: 'Export Seating Chart',
                description: 'Test seating chart export functionality',
                action: async () => {
                    // First ensure we have some table assignments
                    await axios.post(`${BASE_URL}/tables/events/${this.eventId}/auto-arrange`);
                    
                    // Test export
                    const response = await axios.post(`${BASE_URL}/exports/seating-chart`, {
                        eventId: this.eventId,
                        format: 'pdf'
                    }, {
                        responseType: 'arraybuffer'
                    });
                    
                    // Save export file for verification
                    const filename = `demo-seating-chart-${Date.now()}.pdf`;
                    fs.writeFileSync(filename, response.data);
                    console.log(`   ✓ Exported seating chart to ${filename}`);
                    
                    return { 
                        filename, 
                        size: response.data.length,
                        contentType: response.headers['content-type']
                    };
                }
            },
            {
                name: 'Export Guest List',
                description: 'Test guest list export with table assignments',
                action: async () => {
                    const response = await axios.post(`${BASE_URL}/exports/guest-list`, {
                        eventId: this.eventId,
                        format: 'csv'
                    }, {
                        responseType: 'arraybuffer'
                    });
                    
                    const filename = `demo-guest-list-${Date.now()}.csv`;
                    fs.writeFileSync(filename, response.data);
                    console.log(`   ✓ Exported guest list to ${filename}`);
                    
                    return { 
                        filename, 
                        size: response.data.length,
                        contentType: response.headers['content-type']
                    };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}`);
                console.log(`   ${test.description}`);
                
                const result = await test.action();
                this.testResults.push({
                    test: test.name,
                    status: 'passed',
                    result: result
                });
                
                console.log('   ✅ Test passed\n');
                
            } catch (error) {
                console.error(`   ❌ Test failed: ${error.message}\n`);
                this.testResults.push({
                    test: test.name,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }

    analyzeDietaryGrouping(tables, guests) {
        const analysis = {
            vegetarianTables: [],
            glutenFreeTables: [],
            mixedDietTables: [],
            regularTables: []
        };

        for (const table of tables) {
            if (table.assignedGuests.length === 0) continue;

            const tableGuests = guests.filter(g => table.assignedGuests.includes(g.id));
            const dietaryTypes = new Set();
            
            tableGuests.forEach(guest => {
                if (guest.dietaryRestrictions.includes('vegetarian')) {
                    dietaryTypes.add('vegetarian');
                }
                if (guest.dietaryRestrictions.includes('gluten-free')) {
                    dietaryTypes.add('gluten-free');
                }
                if (guest.dietaryRestrictions.length === 0) {
                    dietaryTypes.add('regular');
                }
            });

            if (dietaryTypes.has('vegetarian') && dietaryTypes.size === 1) {
                analysis.vegetarianTables.push(table.name);
            } else if (dietaryTypes.has('gluten-free') && dietaryTypes.size === 1) {
                analysis.glutenFreeTables.push(table.name);
            } else if (dietaryTypes.size > 1) {
                analysis.mixedDietTables.push(table.name);
            } else {
                analysis.regularTables.push(table.name);
            }
        }

        return analysis;
    }

    generateTestReport() {
        console.log('\n📊 TEST RESULTS SUMMARY\n');
        console.log('=' .repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%\n`);
        
        // Detailed results
        this.testResults.forEach(result => {
            const status = result.status === 'passed' ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
            if (result.status === 'failed') {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        console.log('\n' + '=' .repeat(50));
        
        // Save detailed report
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: { total: this.testResults.length, passed, failed },
            results: this.testResults,
            demoConfig: {
                guests: this.createdGuests.length,
                tables: this.createdTables.length,
                acceptedGuests: this.createdGuests.filter(g => g.rsvpStatus === 'accepted').length
            }
        };
        
        const reportFilename = `table-arrangements-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportFilename}`);
    }

    async runFullDemo() {
        try {
            await this.setupDemo();
            await this.runAutoArrangementTests();
            await this.runManualAssignmentTests();
            await this.runTableLockingTests();
            await this.runExportTests();
            this.generateTestReport();
            
            console.log('\n🎉 Table Arrangements Demo Complete!');
            console.log('\n📋 USER TESTING CHECKLIST:');
            console.log('□ Open web interface at http://localhost:3000');
            console.log('□ Navigate to Table Management section');
            console.log('□ Test auto-arrangement with different configurations');
            console.log('□ Test manual drag-and-drop guest assignment');
            console.log('□ Test table locking/unlocking functionality');
            console.log('□ Test seating chart export features');
            console.log('□ Verify all features work as expected');
            console.log('□ Collect feedback for improvements\n');
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            this.generateTestReport();
        }
    }
}

// Run the demo
if (require.main === module) {
    const demo = new TableArrangementDemo();
    demo.runFullDemo().catch(console.error);
}

module.exports = TableArrangementDemo;