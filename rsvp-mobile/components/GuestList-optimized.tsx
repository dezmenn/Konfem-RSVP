import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  const fetchGuests = useCallback(async () => {
    try {
      setError(null);
      
      const url = searchText 
        ? `${config.apiBaseUrl}/api/guests/${eventId}/search?search=${encodeURIComponent(searchText)}`
        : `${config.apiBaseUrl}/api/guests/${eventId}`;

      // Reduce console.log calls to prevent JS thread blocking
      if (__DEV__) {
        console.log('Fetching guests from:', url);
      }

      const response = await fetch(url, {
        timeout: 10000, // 10 second timeout
      });
      
      const data = await response.json();

      if (data.success) {
        setGuests(data.data || []);
      } else {
        setError('Failed to fetch guests');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error fetching guests: ${errorMessage}`);
      if (__DEV__) {
        console.error('Error fetching guests:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId, searchText]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGuests();
  }, [fetchGuests]);

  const deleteGuest = useCallback(async (guestId: string) => {
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
    } catch (err) {
      Alert.alert('Error', 'Failed to delete guest');
    }
  }, [fetchGuests]);

  const handleDeleteGuest = useCallback((guest: Guest) => {
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
  }, [deleteGuest]);

  // Memoize the guest item renderer to prevent unnecessary re-renders
  const renderGuestItem = useCallback(({ item: guest }: { item: Guest }) => (
    <View style={styles.guestItem}>
      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>{guest.name}</Text>
        <Text style={styles.guestDetails}>
          {guest.phoneNumber} • {guest.relationshipType}
        </Text>
        <Text style={styles.guestStatus}>
          RSVP: {guest.rsvpStatus} • Side: {guest.brideOrGroomSide}
        </Text>
        {guest.additionalGuestCount > 0 && (
          <Text style={styles.additionalGuests}>
            +{guest.additionalGuestCount} additional guest{guest.additionalGuestCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <View style={styles.guestActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEditGuest(guest)}
          activeOpacity={0.7}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteGuest(guest)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [onEditGuest, handleDeleteGuest]);

  // Memoize the key extractor
  const keyExtractor = useCallback((item: Guest) => item.id, []);

  // Memoize the filtered guests
  const filteredGuests = useMemo(() => {
    if (!searchText) return guests;
    return guests.filter(guest =>
      guest.name.toLowerCase().includes(searchText.toLowerCase()) ||
      guest.phoneNumber.includes(searchText)
    );
  }, [guests, searchText]);

  if (loading) {
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
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.addButton} onPress={onAddGuest}>
          <Text style={styles.addButtonText}>+ Add Guest</Text>
        </TouchableOpacity>
        {onImportContacts && (
          <TouchableOpacity style={styles.importButton} onPress={onImportContacts}>
            <Text style={styles.importButtonText}>Import Contacts</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search guests..."
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
      </View>

      {/* Guest List */}
      <FlatList
        data={filteredGuests}
        renderItem={renderGuestItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={styles.list}
        removeClippedSubviews={true} // Optimize for performance
        maxToRenderPerBatch={10} // Render 10 items at a time
        windowSize={10} // Keep 10 items in memory
        initialNumToRender={10} // Initial render count
        getItemLayout={(data, index) => ({
          length: 120, // Approximate item height
          offset: 120 * index,
          index,
        })}
      />

      {filteredGuests.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No guests found</Text>
        </View>
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
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  importButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  list: {
    flex: 1,
  },
  guestItem: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  guestDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  guestStatus: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  additionalGuests: {
    fontSize: 12,
    color: '#007bff',
    fontStyle: 'italic',
  },
  guestActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default GuestList;