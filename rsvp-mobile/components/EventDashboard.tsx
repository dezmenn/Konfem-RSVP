import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import config from '../config';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    console.log('fetchAnalytics started');
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const apiUrl = config.apiBaseUrl + '/api/analytics/events/' + eventId;
      console.log('Fetching from URL:', apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log('API Response Data:', data);
      
      if (data.success) {
        setAnalytics(data.data);
        setError(null);
      } else {
        if (data.data === undefined) {
          setError('API response missing data field, check API endpoint for analytics data.');
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('Current error state:', error);
      console.log('fetchAnalytics finished');
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const onRefresh = () => {
    fetchAnalytics(true);
  };

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

  if (loading && !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error Loading Dashboard</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchAnalytics()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{analytics.eventTitle}</Text>
        <Text style={styles.subtitle}>Dashboard</Text>
        <View style={styles.eventInfo}>
          <Text style={styles.eventDate}>Event: {formatDate(analytics.eventDate)}</Text>
          <Text style={styles.rsvpDeadline}>RSVP Deadline: {formatDate(analytics.rsvpDeadline)}</Text>
        </View>
        <Text style={styles.lastUpdated}>
          Last updated: {formatDateTime(analytics.realTimeMetrics.lastUpdated)}
        </Text>
      </View>

      {/* Deadline Alert */}
      {analytics.realTimeMetrics.upcomingDeadline.isOverdue ? (
        <View style={[styles.alert, styles.alertDanger]}>
          <Text style={styles.alertText}>
            <Text style={styles.alertStrong}>RSVP Deadline Passed!</Text> The RSVP deadline has expired.
          </Text>
        </View>
      ) : analytics.realTimeMetrics.upcomingDeadline.daysRemaining <= 3 ? (
        <View style={[styles.alert, styles.alertWarning]}>
          <Text style={styles.alertText}>
            <Text style={styles.alertStrong}>Deadline Approaching!</Text> Only {analytics.realTimeMetrics.upcomingDeadline.daysRemaining} days remaining for RSVPs.
          </Text>
        </View>
      ) : null}

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.guestStats.totalGuests}</Text>
            <Text style={styles.metricLabel}>Total Guests</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.rsvpStats.totalResponses}</Text>
            <Text style={styles.metricLabel}>Total Responses</Text>
            <Text style={styles.metricSubtitle}>{analytics.rsvpStats.responseRate.toFixed(1)}% response rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.rsvpStats.acceptedCount}</Text>
            <Text style={styles.metricLabel}>Accepted</Text>
            <Text style={styles.metricSubtitle}>{analytics.rsvpStats.acceptanceRate.toFixed(1)}% acceptance rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analytics.rsvpStats.totalExpectedAttendees}</Text>
            <Text style={styles.metricLabel}>Expected Attendees</Text>
            <Text style={styles.metricSubtitle}>Including additional guests</Text>
          </View>
        </View>
      </View>

      {/* RSVP Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RSVP Status</Text>
        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, styles.acceptedCard]}>
            <Text style={styles.statusValue}>{analytics.rsvpStats.acceptedCount}</Text>
            <Text style={styles.statusLabel}>Accepted</Text>
          </View>
          <View style={[styles.statusCard, styles.declinedCard]}>
            <Text style={styles.statusValue}>{analytics.rsvpStats.declinedCount}</Text>
            <Text style={styles.statusLabel}>Declined</Text>
          </View>
          <View style={[styles.statusCard, styles.pendingCard]}>
            <Text style={styles.statusValue}>{analytics.rsvpStats.pendingCount}</Text>
            <Text style={styles.statusLabel}>Pending</Text>
          </View>
          <View style={[styles.statusCard, styles.noResponseCard]}>
            <Text style={styles.statusValue}>{analytics.rsvpStats.noResponseCount}</Text>
            <Text style={styles.statusLabel}>No Response</Text>
          </View>
        </View>
      </View>

      {/* Messaging Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messaging</Text>
        <View style={styles.messagingStats}>
          <View style={styles.messagingOverview}>
            <View style={styles.messagingMetric}>
              <Text style={styles.messagingValue}>{analytics.messagingStats.totalMessages}</Text>
              <Text style={styles.messagingLabel}>Total Messages</Text>
            </View>
            <View style={styles.messagingMetric}>
              <Text style={styles.messagingValue}>{analytics.messagingStats.deliveryRate.toFixed(1)}%</Text>
              <Text style={styles.messagingLabel}>Delivery Rate</Text>
            </View>
          </View>
          <View style={styles.messageTypes}>
            <View style={styles.messageType}>
              <Text style={styles.messageTypeLabel}>Invitations:</Text>
              <Text style={styles.messageTypeCount}>{analytics.messagingStats.messageTypeBreakdown.invitation || 0}</Text>
            </View>
            <View style={styles.messageType}>
              <Text style={styles.messageTypeLabel}>Reminders:</Text>
              <Text style={styles.messageTypeCount}>{analytics.messagingStats.messageTypeBreakdown.reminder || 0}</Text>
            </View>
            <View style={styles.messageType}>
              <Text style={styles.messageTypeLabel}>Confirmations:</Text>
              <Text style={styles.messageTypeCount}>{analytics.messagingStats.messageTypeBreakdown.confirmation || 0}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Dietary Requirements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Requirements</Text>
        <View style={styles.dietaryOverview}>
          <Text style={styles.dietaryCount}>{analytics.dietaryStats.totalWithRestrictions}</Text>
          <Text style={styles.dietaryText}> guests with dietary restrictions </Text>
          <Text style={styles.dietaryPercentage}>({analytics.dietaryStats.percentageWithRestrictions.toFixed(1)}%)</Text>
        </View>
        {Object.keys(analytics.dietaryStats.restrictionBreakdown).length > 0 && (
          <View style={styles.dietaryBreakdown}>
            <Text style={styles.dietaryBreakdownTitle}>Breakdown by Type:</Text>
            {Object.entries(analytics.dietaryStats.restrictionBreakdown).map(([restriction, count]) => (
              <View key={restriction} style={styles.dietaryItem}>
                <Text style={styles.restrictionName}>{restriction}</Text>
                <Text style={styles.restrictionCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bride vs Groom Side */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bride vs Groom Side</Text>
        <View style={styles.sideComparison}>
          <View style={[styles.sideStats, styles.brideSide]}>
            <Text style={styles.sideTitle}>Bride's Side</Text>
            <View style={styles.sideBreakdown}>
              <View style={styles.sideMetric}>
                <Text style={styles.sideValue}>{analytics.attendanceTrends.brideVsGroomSide.bride.accepted}</Text>
                <Text style={styles.sideLabel}>Accepted</Text>
              </View>
              <View style={styles.sideMetric}>
                <Text style={styles.sideValue}>{analytics.attendanceTrends.brideVsGroomSide.bride.declined}</Text>
                <Text style={styles.sideLabel}>Declined</Text>
              </View>
              <View style={styles.sideMetric}>
                <Text style={styles.sideValue}>{analytics.attendanceTrends.brideVsGroomSide.bride.pending}</Text>
                <Text style={styles.sideLabel}>Pending</Text>
              </View>
            </View>
          </View>
          <View style={[styles.sideStats, styles.groomSide]}>
            <Text style={styles.sideTitle}>Groom's Side</Text>
            <View style={styles.sideBreakdown}>
              <View style={styles.sideMetric}>
                <Text style={styles.sideValue}>{analytics.attendanceTrends.brideVsGroomSide.groom.accepted}</Text>
                <Text style={styles.sideLabel}>Accepted</Text>
              </View>
              <View style={styles.sideMetric}>
                <Text style={styles.sideValue}>{analytics.attendanceTrends.brideVsGroomSide.groom.declined}</Text>
                <Text style={styles.sideLabel}>Declined</Text>
              </View>
              <View style={styles.sideMetric}>
                <Text style={styles.sideValue}>{analytics.attendanceTrends.brideVsGroomSide.groom.pending}</Text>
                <Text style={styles.sideLabel}>Pending</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Special Requests */}
      {analytics.feedbackStats.totalWithSpecialRequests > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests ({analytics.feedbackStats.totalWithSpecialRequests})</Text>
          {analytics.feedbackStats.specialRequestsBreakdown.map((request, index) => (
            <View key={index} style={styles.requestItem}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestGuest}>{request.guestName}</Text>
                <View style={[styles.requestStatus, (styles as any)[`status${request.rsvpStatus.charAt(0).toUpperCase() + request.rsvpStatus.slice(1)}`]]}>
                  <Text style={styles.requestStatusText}>{request.rsvpStatus}</Text>
                </View>
              </View>
              <Text style={styles.requestText}>{request.request}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Activity */}
      {analytics.realTimeMetrics.recentResponses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {analytics.realTimeMetrics.recentResponses.map((response, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityGuest}>{response.guestName}</Text>
                <Text style={styles.activityTime}>{formatDateTime(response.timestamp)}</Text>
              </View>
              <View style={[styles.activityResponse, (styles as any)[`response${response.responseType.charAt(0).toUpperCase() + response.responseType.slice(1)}`]]}>
                <Text style={styles.activityResponseText}>{response.responseType}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 15,
  },
  eventInfo: {
    marginBottom: 10,
  },
  eventDate: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
  },
  rsvpDeadline: {
    fontSize: 14,
    color: '#495057',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  alert: {
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  alertDanger: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  alertWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  alertText: {
    fontSize: 14,
    color: '#721c24',
  },
  alertStrong: {
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e9ecef',
    paddingBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#28a745',
    marginTop: 5,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
  },
  acceptedCard: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  declinedCard: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  pendingCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  noResponseCard: {
    backgroundColor: '#e2e3e5',
    borderColor: '#6c757d',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '500',
    },
  messagingStats: {
    gap: 15,
  },
  messagingOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  messagingMetric: {
    alignItems: 'center',
  },
  messagingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  messagingLabel: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  messageTypes: {
    gap: 10,
  },
  messageType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
  },
  messageTypeLabel: {
    fontSize: 14,
    color: '#495057',
  },
  messageTypeCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  dietaryOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dietaryCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  dietaryText: {
    fontSize: 14,
    color: '#495057',
  },
  dietaryPercentage: {
    fontSize: 12,
    color: '#6c757d',
  },
  dietaryBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 15,
  },
  dietaryBreakdownTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 10,
  },
  dietaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
    marginBottom: 5,
  },
  restrictionName: {
    fontSize: 14,
    color: '#495057',
  },
  restrictionCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007bff',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sideComparison: {
    gap: 15,
  },
  sideStats: {
    padding: 15,
    borderRadius: 6,
    borderWidth: 2,
  },
  brideSide: {
    backgroundColor: '#fce4ec',
    borderColor: '#e91e63',
  },
  groomSide: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sideBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sideMetric: {
    alignItems: 'center',
  },
  sideValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sideLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  requestItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    marginBottom: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestGuest: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  requestStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusAccepted: {
    backgroundColor: '#28a745',
  },
  statusDeclined: {
    backgroundColor: '#dc3545',
  },
  statusPending: {
    backgroundColor: '#ffc107',
  },
  requestStatusText: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '500',
    color: 'white',
  },
  requestText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  activityItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityGuest: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  activityTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  activityResponse: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  responseAccepted: {
    backgroundColor: '#28a745',
  },
  responseDeclined: {
    backgroundColor: '#dc3545',
  },
  activityResponseText: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '500',
    color: 'white',
  },
});

export default EventDashboard;