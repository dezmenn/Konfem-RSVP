import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Guest } from '../types';
import { config } from '../config';

interface GuestListProps {
  eventId: string;
  onEditGuest: (guest: Guest) => void;
  onAddGuest: () => void;
  onImportContacts?: () => void;
}

interface GuestFilters {
  search: string;
  rsvpStatus: string[];
  brideOrGroomSide: string[];
}

const RSVP_STATUSES = ['accepted', 'declined', 'pending', 'no_response'];
const SIDES = ['bride', 'groom'];

const GuestList: React.FC<GuestListProps> = ({
  eventId,
  onEditGuest,
  onAddGuest,
  onImportContacts,
}) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GuestFilters>({
    search: '',
    rsvpStatus: [],
    brideOrGroomSide: [],
  });

  const toggleFilter = (filterName: keyof GuestFilters, value: string) => {
    setFilters(prevFilters => {
      const currentValues = prevFilters[filterName] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prevFilters, [filterName]: newValues };
    });
  };

  useEffect(() => {
    fetchGuests();
  }, [eventId, filters, searchText]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchText) {
        params.append('search', searchText);
      }
      filters.rsvpStatus.forEach(status => params.append('rsvpStatus', status));
      filters.brideOrGroomSide.forEach(side => params.append('brideOrGroomSide', side));
      
      const url = `${config.apiBaseUrl}/api/guests/${eventId}?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setGuests(data.data);
      } else {
        setError('Failed to fetch guests');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error fetching guests: ${err.message}`);
      } else {
        setError('An unknown error occurred while fetching guests.');
      }
      console.error('Error fetching guests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGuests();
  };

  const handleDeleteGuest = (guest: Guest) => {
    Alert.alert(
      'Delete Guest',
      `Are you sure you want to delete ${guest.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGuest(guest.id),
        },
      ]
    );
  };

  const deleteGuest = async (guestId: string) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/guests/${guestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchGuests(); // Refresh the list
      } else {
        Alert.alert('Error', 'Failed to delete guest');
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      Alert.alert('Error', 'Error deleting guest');
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#28a745';
      case 'declined': return '#dc3545';
      case 'pending': return '#ffc107';
      case 'no_response': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const renderGuestItem = ({ item }: { item: Guest }) => (
    <View style={styles.guestCard}>
      <View style={styles.guestHeader}>
        <Text style={styles.guestName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getRSVPStatusColor(item.rsvpStatus) }]}>
          <Text style={styles.statusText}>
            {item.rsvpStatus.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.guestPhone}>{item.phoneNumber}</Text>
      
      <View style={styles.guestDetails}>
        <Text style={styles.detailText}>
          {item.relationshipType} • {item.brideOrGroomSide === 'bride' ? "Bride's Side" : "Groom's Side"}
        </Text>
        {item.additionalGuestCount > 0 && (
          <Text style={styles.detailText}>
            +{item.additionalGuestCount} additional guest{item.additionalGuestCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {item.dietaryRestrictions.length > 0 && (
        <View style={styles.dietaryContainer}>
          <Text style={styles.dietaryLabel}>Dietary: </Text>
          <Text style={styles.dietaryText}>
            {item.dietaryRestrictions.join(', ')}
          </Text>
        </View>
      )}

      {item.tableAssignment && (
        <Text style={styles.tableAssignment}>Table: {item.tableAssignment}</Text>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEditGuest(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteGuest(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading guests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchGuests}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guests ({guests.length})</Text>
        <View style={styles.headerActions}>
          {onImportContacts && (
            <TouchableOpacity style={styles.importButton} onPress={onImportContacts}>
              <Text style={styles.importButtonText}>Import</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addButton} onPress={onAddGuest}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search guests..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={fetchGuests}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filterContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>RSVP Status</Text>
              <View style={styles.filterOptions}>
                {RSVP_STATUSES.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionButton,
                      filters.rsvpStatus.includes(status) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleFilter('rsvpStatus', status)}
                  >
                    <Text style={[styles.optionButtonText, filters.rsvpStatus.includes(status) && styles.optionButtonTextSelected]}>{status.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Side</Text>
              <View style={styles.filterOptions}>
                {SIDES.map(side => (
                  <TouchableOpacity
                    key={side}
                    style={[
                      styles.optionButton,
                      filters.brideOrGroomSide.includes(side) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleFilter('brideOrGroomSide', side)}
                  >
                    <Text style={[styles.optionButtonText, filters.brideOrGroomSide.includes(side) && styles.optionButtonTextSelected]}>{side}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {guests.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No guests found</Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={onAddGuest}>
            <Text style={styles.addFirstButtonText}>Add Your First Guest</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={guests}
          renderItem={renderGuestItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  importButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  controlsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f1f3f5'
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 15,
  },
  filterGroup: {
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#495057'
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  optionButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3'
  },
  optionButtonText: {
    color: '#495057',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  optionButtonTextSelected: {
    color: 'white',
  },
  listContainer: {
    padding: 15,
  },
  guestCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  guestPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  guestDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dietaryContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dietaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dietaryText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  tableAssignment: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
  },
  editButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  addFirstButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GuestList;