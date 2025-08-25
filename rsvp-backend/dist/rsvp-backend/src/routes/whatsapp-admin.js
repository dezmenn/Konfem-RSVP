"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWhatsAppMockService = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
// This will be injected by the main server
let whatsAppMockService;
const setWhatsAppMockService = (service) => {
    whatsAppMockService = service;
};
exports.setWhatsAppMockService = setWhatsAppMockService;
// GET /api/whatsapp-admin/messages - Get all sent messages
router.get('/messages', (req, res) => {
    try {
        const messages = whatsAppMockService.getSentMessages();
        res.json({
            success: true,
            data: messages,
            total: messages.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve messages',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/whatsapp-admin/delivery-status - Get all delivery statuses
router.get('/delivery-status', (req, res) => {
    try {
        const statuses = whatsAppMockService.getDeliveryStatuses();
        res.json({
            success: true,
            data: statuses,
            total: statuses.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve delivery statuses',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/whatsapp-admin/message/:messageId - Get specific message and its status
router.get('/message/:messageId', (req, res) => {
    try {
        const { messageId } = req.params;
        const message = whatsAppMockService.getMessageById(messageId);
        const deliveryStatus = whatsAppMockService.getDeliveryStatus(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }
        res.json({
            success: true,
            data: {
                message,
                deliveryStatus
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve message',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/whatsapp-admin/stats - Get service statistics
router.get('/stats', (req, res) => {
    try {
        const stats = whatsAppMockService.getStats();
        const rateLimitStatus = whatsAppMockService.getRateLimitStatus();
        const config = whatsAppMockService.getConfig();
        res.json({
            success: true,
            data: {
                messageStats: stats,
                rateLimitStatus,
                config
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve stats',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/whatsapp-admin/rate-limits - Get rate limit status
router.get('/rate-limits', (req, res) => {
    try {
        const rateLimitStatus = whatsAppMockService.getRateLimitStatus();
        res.json({
            success: true,
            data: rateLimitStatus
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve rate limit status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /api/whatsapp-admin/config - Update service configuration
router.post('/config', (req, res) => {
    try {
        const newConfig = req.body;
        whatsAppMockService.updateConfig(newConfig);
        res.json({
            success: true,
            message: 'Configuration updated successfully',
            data: whatsAppMockService.getConfig()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update configuration',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /api/whatsapp-admin/reset - Reset the service (clear all data)
router.post('/reset', (req, res) => {
    try {
        whatsAppMockService.reset();
        res.json({
            success: true,
            message: 'WhatsApp mock service reset successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to reset service',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /api/whatsapp-admin/clear-rate-limits - Clear all rate limits
router.post('/clear-rate-limits', (req, res) => {
    try {
        whatsAppMockService.clearRateLimits();
        res.json({
            success: true,
            message: 'Rate limits cleared successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to clear rate limits',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/whatsapp-admin/dashboard - Get dashboard data (HTML interface)
router.get('/dashboard', (req, res) => {
    try {
        const messages = whatsAppMockService.getSentMessages();
        const statuses = whatsAppMockService.getDeliveryStatuses();
        const stats = whatsAppMockService.getStats();
        const rateLimitStatus = whatsAppMockService.getRateLimitStatus();
        const config = whatsAppMockService.getConfig();
        // Simple HTML dashboard
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Mock Service Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat { text-align: center; padding: 20px; background: #e3f2fd; border-radius: 8px; }
        .stat h3 { margin: 0; color: #1976d2; }
        .stat p { margin: 5px 0 0 0; font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .status-sent { color: #4caf50; }
        .status-delivered { color: #2196f3; }
        .status-failed { color: #f44336; }
        .status-pending { color: #ff9800; }
        .config { background: #f8f9fa; padding: 15px; border-radius: 4px; }
        .refresh-btn { background: #4caf50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #45a049; }
        .message-content { max-width: 500px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; line-height: 1.4; background: #f8f9fa; padding: 10px; border-radius: 4px; border-left: 3px solid #1976d2; }
    </style>
    <script>
        function refreshPage() {
            location.reload();
        }
        
        function resetService() {
            if (confirm('Are you sure you want to reset the WhatsApp mock service? This will clear all messages and delivery statuses.')) {
                const button = event.target;
                button.disabled = true;
                button.textContent = '🔄 Resetting...';
                
                fetch(window.location.origin + '/api/whatsapp-admin/reset', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    alert(data.message || 'Service reset successfully');
                    location.reload();
                })
                .catch(error => {
                    console.error('Reset error:', error);
                    alert('Error resetting service: ' + error.message);
                    button.disabled = false;
                    button.textContent = '🗑️ Reset Service';
                });
            }
        }
        
        function clearRateLimits() {
            const button = event.target;
            button.disabled = true;
            button.textContent = '🔄 Clearing...';
            
            fetch(window.location.origin + '/api/whatsapp-admin/clear-rate-limits', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                alert(data.message || 'Rate limits cleared successfully');
                location.reload();
            })
            .catch(error => {
                console.error('Clear rate limits error:', error);
                alert('Error clearing rate limits: ' + error.message);
                button.disabled = false;
                button.textContent = '⏱️ Clear Rate Limits';
            });
        }
        
        
        // Function to update dashboard data dynamically
        async function updateDashboard() {
            try {
                console.log('🔄 Updating dashboard data...');
                
                // Fetch current stats
                const statsResponse = await fetch(window.location.origin + '/api/whatsapp-admin/stats');
                if (!statsResponse.ok) {
                    throw new Error(\`Stats API error: \${statsResponse.status} \${statsResponse.statusText}\`);
                }
                const statsData = await statsResponse.json();
                
                if (statsData.success) {
                    const stats = statsData.data.messageStats;
                    const rateLimitStatus = statsData.data.rateLimitStatus;
                    const config = statsData.data.config;
                    
                    console.log('📊 Stats data:', stats);
                    
                    // Update statistics with error checking
                    const totalSentEl = document.getElementById('total-sent');
                    const totalDeliveredEl = document.getElementById('total-delivered');
                    const totalFailedEl = document.getElementById('total-failed');
                    const deliveryRateEl = document.getElementById('delivery-rate');
                    
                    if (totalSentEl) totalSentEl.textContent = stats.totalSent;
                    if (totalDeliveredEl) totalDeliveredEl.textContent = stats.totalDelivered;
                    if (totalFailedEl) totalFailedEl.textContent = stats.totalFailed;
                    if (deliveryRateEl) deliveryRateEl.textContent = stats.deliveryRate + '%';
                    
                    // Update configuration
                    const configElements = {
                        'config-rate-limiting': (config.enableRateLimiting ? 'Enabled' : 'Disabled') + ' (' + config.rateLimitPerMinute + '/min)',
                        'config-delivery-delay': config.simulateDeliveryDelay ? config.deliveryDelayMs + 'ms' : 'Disabled',
                        'config-error-rate': (config.errorRate * 100).toFixed(1) + '%',
                        'config-logging': config.enableLogging ? 'Enabled' : 'Disabled'
                    };
                    
                    Object.entries(configElements).forEach(([id, text]) => {
                        const el = document.getElementById(id);
                        if (el) el.textContent = text;
                    });
                    
                    // Update rate limit status table
                    const rateLimitTableBody = document.getElementById('rate-limit-table-body');
                    if (rateLimitTableBody) {
                        rateLimitTableBody.innerHTML = '';
                        if (rateLimitStatus.length === 0) {
                            rateLimitTableBody.innerHTML = '<tr><td colspan="3">No rate limit data</td></tr>';
                        } else {
                            rateLimitStatus.forEach(status => {
                                const row = document.createElement('tr');
                                row.innerHTML = \`
                                    <td>\${status.phoneNumber}</td>
                                    <td>\${status.recentMessages}/\${config.rateLimitPerMinute}</td>
                                    <td class="\${status.isLimited ? 'status-failed' : 'status-delivered'}">
                                        \${status.isLimited ? 'LIMITED' : 'OK'}
                                    </td>
                                \`;
                                rateLimitTableBody.appendChild(row);
                            });
                        }
                    }
                } else {
                    console.error('❌ Stats API returned error:', statsData.error);
                }
                
                // Fetch messages
                const messagesResponse = await fetch(window.location.origin + '/api/whatsapp-admin/messages');
                if (!messagesResponse.ok) {
                    throw new Error(\`Messages API error: \${messagesResponse.status} \${messagesResponse.statusText}\`);
                }
                const messagesData = await messagesResponse.json();
                
                if (messagesData.success) {
                    const messages = messagesData.data;
                    console.log(\`📱 Found \${messages.length} messages\`);
                    
                    // Fetch delivery statuses
                    const statusResponse = await fetch(window.location.origin + '/api/whatsapp-admin/delivery-status');
                    if (!statusResponse.ok) {
                        throw new Error(\`Status API error: \${statusResponse.status} \${statusResponse.statusText}\`);
                    }
                    const statusData = await statusResponse.json();
                    const statuses = statusData.success ? statusData.data : [];
                    
                    // Update messages table
                    const messagesTableBody = document.getElementById('messages-table-body');
                    if (messagesTableBody) {
                        messagesTableBody.innerHTML = '';
                        
                        if (messages.length === 0) {
                            messagesTableBody.innerHTML = '<tr><td colspan="5">No messages found</td></tr>';
                        } else {
                            // Show last 20 messages, most recent first
                            const recentMessages = messages.slice(-20).reverse();
                            recentMessages.forEach((msg, index) => {
                                const status = statuses.find(s => s.messageId === msg.messageId);
                                const statusClass = status ? \`status-\${status.status}\` : 'status-pending';
                                const statusText = status ? status.status.toUpperCase() : 'UNKNOWN';
                                const row = document.createElement('tr');
                                const messageId = \`msg-\${index}\`;
                                
                                // Show full message content directly
                                const contentHtml = '<div class="message-content">' + msg.content + '</div>';
                                
                                // Create row cells individually to avoid HTML escaping issues
                                const timeCell = document.createElement('td');
                                timeCell.textContent = new Date(msg.timestamp).toLocaleString();
                                
                                const toCell = document.createElement('td');
                                toCell.textContent = msg.to;
                                
                                const contentCell = document.createElement('td');
                                contentCell.innerHTML = contentHtml;
                                
                                const idCell = document.createElement('td');
                                idCell.style.fontFamily = 'monospace';
                                idCell.style.fontSize = '12px';
                                idCell.textContent = msg.messageId;
                                
                                const statusCell = document.createElement('td');
                                statusCell.className = statusClass;
                                statusCell.textContent = statusText;
                                
                                row.appendChild(timeCell);
                                row.appendChild(toCell);
                                row.appendChild(contentCell);
                                row.appendChild(idCell);
                                row.appendChild(statusCell);
                                
                                messagesTableBody.appendChild(row);
                            });
                        }
                    }
                } else {
                    console.error('❌ Messages API returned error:', messagesData.error);
                }
                
                // Update last refresh time
                const now = new Date();
                const refreshTimeEl = document.getElementById('last-refresh');
                if (refreshTimeEl) {
                    refreshTimeEl.textContent = now.toLocaleTimeString();
                }
                
                console.log('✅ Dashboard updated successfully at', now.toLocaleTimeString());
            } catch (error) {
                console.error('❌ Error updating dashboard:', error);
                // Show error in UI
                const errorEl = document.getElementById('error-message');
                if (errorEl) {
                    errorEl.textContent = 'Error updating dashboard: ' + error.message;
                    errorEl.style.display = 'block';
                    setTimeout(() => {
                        errorEl.style.display = 'none';
                    }, 5000);
                }
            }
        }
        
        // Initialize event listeners when page loads
        document.addEventListener('DOMContentLoaded', function() {
            console.log('WhatsApp Admin Dashboard loaded');
            console.log('Base URL:', window.location.origin);
            
            // Add event listeners instead of inline onclick
            document.getElementById('refresh-btn').addEventListener('click', function() {
                updateDashboard();
            });
            document.getElementById('reset-btn').addEventListener('click', resetService);
            document.getElementById('clear-limits-btn').addEventListener('click', clearRateLimits);
            
            // Auto-refresh every 5 seconds
            setInterval(updateDashboard, 5000);
            
            // Initial load
            updateDashboard();
        });
    </script>
</head>
<body>
    <div class="container">
        <h1>📱 WhatsApp Mock Service Dashboard</h1>
        
        <div style="margin-bottom: 20px;">
            <button id="refresh-btn" class="refresh-btn">🔄 Refresh</button>
            <button id="reset-btn" class="refresh-btn" style="background: #f44336; margin-left: 10px;">🗑️ Reset Service</button>
            <button id="clear-limits-btn" class="refresh-btn" style="background: #ff9800; margin-left: 10px;">⏱️ Clear Rate Limits</button>
            <span style="margin-left: 20px; color: #666;">Last updated: <span id="last-refresh">Never</span></span>
        </div>
        
        <div id="error-message" style="display: none; background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #f44336;">
        </div>

        <div class="card">
            <h2>📊 Statistics</h2>
            <div class="stats">
                <div class="stat">
                    <h3>Total Sent</h3>
                    <p id="total-sent">0</p>
                </div>
                <div class="stat">
                    <h3>Delivered</h3>
                    <p id="total-delivered">0</p>
                </div>
                <div class="stat">
                    <h3>Failed</h3>
                    <p id="total-failed">0</p>
                </div>
                <div class="stat">
                    <h3>Delivery Rate</h3>
                    <p id="delivery-rate">0%</p>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>⚙️ Configuration</h2>
            <div class="config">
                <p><strong>Rate Limiting:</strong> <span id="config-rate-limiting">Loading...</span></p>
                <p><strong>Delivery Delay:</strong> <span id="config-delivery-delay">Loading...</span></p>
                <p><strong>Error Rate:</strong> <span id="config-error-rate">Loading...</span></p>
                <p><strong>Logging:</strong> <span id="config-logging">Loading...</span></p>
            </div>
        </div>

        <div class="card">
            <h2>📱 Recent Messages</h2>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>To</th>
                        <th>Message Content</th>
                        <th>Message ID</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="messages-table-body">
                    <tr><td colspan="5">Loading messages...</td></tr>
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>⏱️ Rate Limit Status</h2>
            <table>
                <thead>
                    <tr>
                        <th>Phone Number</th>
                        <th>Recent Messages</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="rate-limit-table-body">
                    <tr><td colspan="3">Loading rate limits...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
    `;
        res.send(html);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate dashboard',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=whatsapp-admin.js.map