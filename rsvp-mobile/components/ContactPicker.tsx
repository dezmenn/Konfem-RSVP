import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { ContactData, ImportResult } from '../types';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'web' ? '' : 'http://192.168.100.55:5000';

interface ContactPickerProps {
  eventId: string;
  visible: boolean;
  onImportComplete: (result: ImportResult) => void;
  onCancel: () => void;
}

interface ContactItem extends ContactData {
  selected: boolean;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  eventId,
  visible,
  onImportComplete,
  onCancel,
}) => {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible) {
      requestPermissionAndLoadContacts();
    }
  }, [visible]);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts]);

  const requestPermissionAndLoadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        await loadContacts();
      } else {
        Alert.alert(
          'Permission Required',
          'This app needs access to your contacts to import guests.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'Settings', onPress: () => Contacts.requestPermissionsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      Alert.alert('Error', 'Failed to access contacts');
    }
  };

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });

      const contactItems: ContactItem[] = data
        .filter(contact => 
          contact.name && 
          contact.phoneNumbers && 
          contact.phoneNumbers.length > 0
        )
        .map(contact => ({
          id: contact.id || '',
          name: contact.name || '',
          phoneNumbers: contact.phoneNumbers?.map(phone => phone.number || '') || [],
          emails: contact.emails?.map(email => email.email || '') || [],
          selected: false,
        }));

      setContacts(contactItems);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.phoneNumbers.some(phone => phone.includes(query))
    );
    setFilteredContacts(filtered);
  };

  const toggleContactSelection = (contactId: string) => {
    const updatedContacts = contacts.map(contact =>
      contact.id === contactId
        ? { ...contact, selected: !contact.selected }
        : contact
    );
    setContacts(updatedContacts);
  };

  const selectAll = () => {
    const updatedContacts = contacts.map(contact => ({
      ...contact,
      selected: true,
    }));
    setContacts(updatedContacts);
  };

  const deselectAll = () => {
    const updatedContacts = contacts.map(contact => ({
      ...contact,
      selected: false,
    }));
    setContacts(updatedContacts);
  };

  const importSelectedContacts = async () => {
    const selectedContacts = contacts.filter(contact => contact.selected);
    
    if (selectedContacts.length === 0) {
      Alert.alert('No Selection', 'Please select at least one contact to import.');
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/guests/${eventId}/import/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: selectedContacts,
        }),
      });

      const result = await response.json();
      onImportComplete(result.data);
    } catch (error) {
      console.error('Error importing contacts:', error);
      Alert.alert('Error', 'Failed to import contacts');
      setIsImporting(false);
    }
  };

  const selectedCount = contacts.filter(contact => contact.selected).length;

  const renderContactItem = ({ item }: { item: ContactItem }) => (
    <TouchableOpacity
      style={[styles.contactItem, item.selected && styles.selectedContactItem]}
      onPress={() => toggleContactSelection(item.id)}
    >
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>
          {item.phoneNumbers[0]}
          {item.phoneNumbers.length > 1 && ` (+${item.phoneNumbers.length - 1} more)`}
        </Text>
      </View>
      <View style={[styles.checkbox, item.selected && styles.checkedCheckbox]}>
        {item.selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Import Contacts</Text>
          <TouchableOpacity
            onPress={importSelectedContacts}
            disabled={selectedCount === 0 || isImporting}
            style={[styles.importButton, (selectedCount === 0 || isImporting) && styles.disabledButton]}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.importButtonText}>
                Import ({selectedCount})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {hasPermission === false ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              Contact permission is required to import guests from your contacts.
            </Text>
            <TouchableOpacity
              onPress={requestPermissionAndLoadContacts}
              style={styles.permissionButton}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.selectionControls}>
              <TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
                <Text style={styles.selectionButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deselectAll} style={styles.selectionButton}>
                <Text style={styles.selectionButtonText}>Deselect All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={(item) => item.id}
              style={styles.contactsList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {selectedCount} of {contacts.length} contacts selected
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 50, // Account for status bar
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  importButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  importButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectionButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedContactItem: {
    backgroundColor: '#eff6ff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
});