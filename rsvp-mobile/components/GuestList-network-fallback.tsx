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
import { useDebounce } from '../hooks/useDebounce';

interface GuestListProps {
  eventId: string;
  onEditGuest: (guest: Guest) => void;
  onAddGuest: () => void;
  onImportContacts?: () => void;
}

interface GuestFilters {
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
  const debouncedSearchText = useDebounce(searchText, 500);
  const [currentApiUrl, setCurrentApiUrl] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GuestFilters>({
    rsvpStatus: [],
    brideOrGroomSide: [],
  });

  const apiEndpoints = [
    'http://192.168.100.55:5000',
    'http://10.0.2.2:5000',
    'http://localhost:5000',
  ];

  const toggleFilter = (filterName: keyof GuestFilters, value: string) => {
    setFilters(prevFilters => {
      const currentValues = prevFilters[filterName] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prevFilters, [filterName]: newValues };
    });
  };

  const fetchGuestsWithFallback = useCallback(async () => {
    setError(null);
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearchText) {
      params.append('search', debouncedSearchText);
    }
    filters.rsvpStatus.forEach(status => params.append('rsvpStatus', status));
    filters.brideOrGroomSide.forEach(side => params.append('brideOrGroomSide', side));
    const queryString = params.toString();

    for (const baseUrl of apiEndpoints) {
      try {
        const url = `${baseUrl}/api/guests/${eventId}?${queryString}`;
        console.log(`Trying API endpoint: ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal });
        
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.success) {
          setGuests(data.data || []);
          setCurrentApiUrl(baseUrl);
          console.log(`✅ Successfully connected to: ${baseUrl}`);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log(`❌ Failed to connect to: ${baseUrl}`);
        continue;
      }
    }

    setError('Unable to connect to server. Please check your connection.');
    console.log('❌ All API endpoints failed');
    setLoading(false);
  }, [eventId, debouncedSearchText, filters]);

  useEffect(() => {
    fetchGuestsWithFallback();
  }, [fetchGuestsWithFallback]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGuestsWithFallback().finally(() => setRefreshing(false));
  }, [fetchGuestsWithFallback]);

  const deleteGuest = useCallback(async (guestId: string) => {
    if (!currentApiUrl) {
      Alert.alert('Error', 'No active connection to server');
      return;
    }
    try {
      const response = await fetch(`${currentApiUrl}/api/guests/${guestId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        handleRefresh();
      } else {
        Alert.alert('Error', 'Failed to delete guest');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete guest');
    }
  }, [currentApiUrl, handleRefresh]);

  const handleDeleteGuest = useCallback((guest: Guest) => {
    Alert.alert('Delete Guest', `Are you sure you want to delete ${guest.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGuest(guest.id) },
    ]);
  }, [deleteGuest]);

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
        <TouchableOpacity style={styles.editButton} onPress={() => onEditGuest(guest)} activeOpacity={0.7}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGuest(guest)} activeOpacity={0.7}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [onEditGuest, handleDeleteGuest]);

  const keyExtractor = useCallback((item: Guest) => item.id, []);

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
        <TouchableOpacity style={styles.retryButton} onPress={fetchGuestsWithFallback}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentApiUrl && (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>✅ Connected to: {currentApiUrl}</Text>
        </View>
      )}
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
      
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search guests or phone number..."
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterToggleButton} onPress={() => setShowFilters(!showFilters)}>
            <Text style={styles.filterToggleButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>RSVP Status</Text>
              <View style={styles.filterOptions}>
                {RSVP_STATUSES.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.optionButton, filters.rsvpStatus.includes(status) && styles.optionButtonSelected]}
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
                    style={[styles.optionButton, filters.brideOrGroomSide.includes(side) && styles.optionButtonSelected]}
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

      <FlatList
        data={guests}
        renderItem={renderGuestItem}
        keyExtractor={keyExtractor}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        style={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No guests found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  errorText: { fontSize: 16, color: '#dc3545', textAlign: 'center', marginBottom: 10 },
  retryButton: { backgroundColor: '#007bff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  connectionStatus: { backgroundColor: '#d4edda', padding: 8, borderBottomWidth: 1, borderBottomColor: '#c3e6cb' },
  connectionText: { fontSize: 12, color: '#155724', textAlign: 'center' },
  headerActions: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  addButton: { backgroundColor: '#28a745', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5, marginRight: 10 },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  importButton: { backgroundColor: '#17a2b8', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5 },
  importButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  controlsContainer: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  searchContainer: { flexDirection: 'row', padding: 15, gap: 10, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, backgroundColor: '#f8f9fa' },
  filterToggleButton: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007bff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  filterToggleButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  filterPanel: { paddingHorizontal: 15, paddingTop: 0, paddingBottom: 15 },
  filterGroup: { marginBottom: 10 },
  filterTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#495057' },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#e9ecef', borderRadius: 16, borderWidth: 1, borderColor: '#dee2e6' },
  optionButtonSelected: { backgroundColor: '#007bff', borderColor: '#0056b3' },
  optionButtonText: { color: '#495057', fontWeight: '500', textTransform: 'capitalize' },
  optionButtonTextSelected: { color: 'white' },
  list: { flex: 1 },
  guestItem: { backgroundColor: 'white', marginHorizontal: 15, marginVertical: 5, padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  guestInfo: { flex: 1 },
  guestName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  guestDetails: { fontSize: 14, color: '#666', marginBottom: 2 },
  guestStatus: { fontSize: 12, color: '#888', marginBottom: 2 },
  additionalGuests: { fontSize: 12, color: '#007bff', fontStyle: 'italic' },
  guestActions: { flexDirection: 'row' },
  editButton: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginRight: 8 },
  editButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  deleteButton: { backgroundColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  deleteButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, color: '#666' },
});

export default GuestList;