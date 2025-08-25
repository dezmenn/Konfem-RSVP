import React, { useState, useEffect } from 'react';
import './EventDashboard.css';

interface EventAnalytics {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  rsvpDeadline: string;
  guestStats: {
    totalGuests: number;
    rsvpStatusCounts: Record<string, number>;
    dietaryRestrictionsSummary: Record<string, number>;
    brideGroomSideCounts: { bride: number; groom: number };
    relationshipTypeCounts: Record<string, number>;
  };
  rsvpStats: {
    totalResponses: number;
    acceptedCount: number;
    declinedCount: number;
    pendingCount: number;
    noResponseCount: number;
    responseRate: number;
    acceptanceRate: number;
    totalExpectedAttendees: number;
    averageResponseTime: number;
    responseTrend: Array<{
      date: string;
      acceptedCount: number;
      declinedCount: number;
      cumulativeTotal: number;
    }>;
  };
  messagingStats: {
    totalMessages: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    pendingMessages: number;
    deliveryRate: number;
    messageTypeBreakdown: Record<string, number>;
    invitationsSent: number;
    remindersSent: number;
    confirmationsSent: number;
  };
  dietaryStats: {
    totalWithRestrictions: number;
    restrictionBreakdown: Record<string, number>;
    percentageWithRestrictions: number;
  };
  feedbackStats: {
    totalWithSpecialRequests: number;
    specialRequestsBreakdown: Array<{
      guestName: string;
      request: string;
      rsvpStatus: string;
    }>;
  };
  attendanceTrends: {
    brideVsGroomSide: {
      bride: { accepted: number; declined: number; pending: number };
      groom: { accepted: number; declined: number; pending: number };
    };
    relationshipBreakdown: Record<string, {
      accepted: number;
      declined: number;
      pending: number;
    }>;
  };
  realTimeMetrics: {
    lastUpdated: string;
    recentResponses: Array<{
      guestName: string;
      responseType: string;
      timestamp: string;
    }>;
    upcomingDeadline: {
      daysRemaining: number;
      hoursRemaining: number;
      isOverdue: boolean;
    };
  };
}

interface EventDashboardProps {
  eventId: string;
}

const EventDashboard: React.FC<EventDashboardProps> = ({ eventId }) => {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/analytics/events/${eventId}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [eventId]);

  const handleRefresh = () => {
    setLoading(true);
    fetchAnalytics();
  };

  if (loading && !analytics) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="dashboard-container">
        <div className="no-data">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>{analytics.eventTitle} Dashboard</h1>
          <div className="event-info">
            <span className="event-date">Event Date: {formatDate(analytics.eventDate)}</span>
            <span className="rsvp-deadline">RSVP Deadline: {formatDate(analytics.rsvpDeadline)}</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-button" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="last-updated">
            Last updated: {formatDateTime(analytics.realTimeMetrics.lastUpdated)}
          </span>
        </div>
      </div>

      {/* Deadline Alert */}
      {analytics.realTimeMetrics.upcomingDeadline.isOverdue ? (
        <div className="alert alert-danger">
          <strong>RSVP Deadline Passed!</strong> The RSVP deadline has expired.
        </div>
      ) : analytics.realTimeMetrics.upcomingDeadline.daysRemaining <= 3 ? (
        <div className="alert alert-warning">
          <strong>Deadline Approaching!</strong> Only {analytics.realTimeMetrics.upcomingDeadline.daysRemaining} days remaining for RSVPs.
        </div>
      ) : null}

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{analytics.guestStats.totalGuests}</div>
          <div className="metric-label">Total Guests</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.rsvpStats.totalResponses}</div>
          <div className="metric-label">Total Responses</div>
          <div className="metric-subtitle">{analytics.rsvpStats.responseRate.toFixed(1)}% response rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.rsvpStats.acceptedCount}</div>
          <div className="metric-label">Accepted</div>
          <div className="metric-subtitle">{analytics.rsvpStats.acceptanceRate.toFixed(1)}% acceptance rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.rsvpStats.totalExpectedAttendees}</div>
          <div className="metric-label">Expected Attendees</div>
          <div className="metric-subtitle">Including additional guests</div>
        </div>
      </div>

      {/* RSVP Status Breakdown */}
      <div className="dashboard-section">
        <h2>RSVP Status Breakdown</h2>
        <div className="status-grid">
          <div className="status-item accepted">
            <div className="status-count">{analytics.rsvpStats.acceptedCount}</div>
            <div className="status-label">Accepted</div>
          </div>
          <div className="status-item declined">
            <div className="status-count">{analytics.rsvpStats.declinedCount}</div>
            <div className="status-label">Declined</div>
          </div>
          <div className="status-item pending">
            <div className="status-count">{analytics.rsvpStats.pendingCount}</div>
            <div className="status-label">Pending</div>
          </div>
          <div className="status-item no-response">
            <div className="status-count">{analytics.rsvpStats.noResponseCount}</div>
            <div className="status-label">No Response</div>
          </div>
        </div>
      </div>

      {/* Messaging Statistics */}
      <div className="dashboard-section">
        <h2>Messaging Statistics</h2>
        <div className="messaging-stats">
          <div className="messaging-overview">
            <div className="messaging-metric">
              <span className="metric-value">{analytics.messagingStats.totalMessages}</span>
              <span className="metric-label">Total Messages</span>
            </div>
            <div className="messaging-metric">
              <span className="metric-value">{analytics.messagingStats.deliveryRate.toFixed(1)}%</span>
              <span className="metric-label">Delivery Rate</span>
            </div>
          </div>
          <div className="message-types">
            <div className="message-type">
              <span className="type-label">Invitations:</span>
              <span className="type-count">{analytics.messagingStats.messageTypeBreakdown.invitation || 0}</span>
            </div>
            <div className="message-type">
              <span className="type-label">Reminders:</span>
              <span className="type-count">{analytics.messagingStats.messageTypeBreakdown.reminder || 0}</span>
            </div>
            <div className="message-type">
              <span className="type-label">Confirmations:</span>
              <span className="type-count">{analytics.messagingStats.messageTypeBreakdown.confirmation || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Requirements */}
      <div className="dashboard-section">
        <h2>Dietary Requirements</h2>
        <div className="dietary-stats">
          <div className="dietary-overview">
            <span className="dietary-count">{analytics.dietaryStats.totalWithRestrictions}</span>
            <span className="dietary-label">guests with dietary restrictions</span>
            <span className="dietary-percentage">({analytics.dietaryStats.percentageWithRestrictions.toFixed(1)}%)</span>
          </div>
          {Object.keys(analytics.dietaryStats.restrictionBreakdown).length > 0 && (
            <div className="dietary-breakdown">
              <h4>Breakdown by Type:</h4>
              <div className="dietary-list">
                {Object.entries(analytics.dietaryStats.restrictionBreakdown).map(([restriction, count]) => (
                  <div key={restriction} className="dietary-item">
                    <span className="restriction-name">{restriction}</span>
                    <span className="restriction-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bride vs Groom Side */}
      <div className="dashboard-section">
        <h2>Bride vs Groom Side</h2>
        <div className="side-comparison">
          <div className="side-stats bride-side">
            <h4>Bride's Side</h4>
            <div className="side-breakdown">
              <div className="side-metric">
                <span className="metric-value">{analytics.attendanceTrends.brideVsGroomSide.bride.accepted}</span>
                <span className="metric-label">Accepted</span>
              </div>
              <div className="side-metric">
                <span className="metric-value">{analytics.attendanceTrends.brideVsGroomSide.bride.declined}</span>
                <span className="metric-label">Declined</span>
              </div>
              <div className="side-metric">
                <span className="metric-value">{analytics.attendanceTrends.brideVsGroomSide.bride.pending}</span>
                <span className="metric-label">Pending</span>
              </div>
            </div>
          </div>
          <div className="side-stats groom-side">
            <h4>Groom's Side</h4>
            <div className="side-breakdown">
              <div className="side-metric">
                <span className="metric-value">{analytics.attendanceTrends.brideVsGroomSide.groom.accepted}</span>
                <span className="metric-label">Accepted</span>
              </div>
              <div className="side-metric">
                <span className="metric-value">{analytics.attendanceTrends.brideVsGroomSide.groom.declined}</span>
                <span className="metric-label">Declined</span>
              </div>
              <div className="side-metric">
                <span className="metric-value">{analytics.attendanceTrends.brideVsGroomSide.groom.pending}</span>
                <span className="metric-label">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      {analytics.feedbackStats.totalWithSpecialRequests > 0 && (
        <div className="dashboard-section">
          <h2>Special Requests ({analytics.feedbackStats.totalWithSpecialRequests})</h2>
          <div className="special-requests">
            {analytics.feedbackStats.specialRequestsBreakdown.map((request, index) => (
              <div key={index} className="request-item">
                <div className="request-guest">
                  <strong>{request.guestName}</strong>
                  <span className={`request-status ${request.rsvpStatus}`}>
                    {request.rsvpStatus}
                  </span>
                </div>
                <div className="request-text">{request.request}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {analytics.realTimeMetrics.recentResponses.length > 0 && (
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="recent-activity">
            {analytics.realTimeMetrics.recentResponses.map((response, index) => (
              <div key={index} className="activity-item">
                <div className="activity-guest">{response.guestName}</div>
                <div className={`activity-response ${response.responseType}`}>
                  {response.responseType}
                </div>
                <div className="activity-time">
                  {formatDateTime(response.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response Trend */}
      {analytics.rsvpStats.responseTrend.length > 0 && (
        <div className="dashboard-section">
          <h2>Response Trend</h2>
          <div className="trend-chart">
            <div className="trend-header">
              <span>Date</span>
              <span>Accepted</span>
              <span>Declined</span>
              <span>Total</span>
            </div>
            {analytics.rsvpStats.responseTrend.slice(-10).map((trend, index) => (
              <div key={index} className="trend-row">
                <span className="trend-date">{formatDate(trend.date)}</span>
                <span className="trend-accepted">{trend.acceptedCount}</span>
                <span className="trend-declined">{trend.declinedCount}</span>
                <span className="trend-total">{trend.cumulativeTotal}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;