import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Guest, ImportResult } from '../types';
import GuestList from './GuestList-network-fallback';
import GuestForm from './GuestForm';
import { ContactPicker } from './ContactPicker';

interface GuestManagementProps {
  eventId: string;
}

const GuestManagement: React.FC<GuestManagementProps> = ({ eventId }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddGuest = () => {
    setEditingGuest(null);
    setShowForm(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setShowForm(true);
  };

  const handleSaveGuest = (guest: Guest) => {
    setShowForm(false);
    setEditingGuest(null);
    // Refresh the guest list
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGuest(null);
  };

  const handleImportContacts = () => {
    setShowContactPicker(true);
  };

  const handleImportComplete = (result: ImportResult) => {
    setShowContactPicker(false);
    
    if (result.success) {
      Alert.alert(
        'Import Successful',
        `Successfully imported ${result.successfulImports} guests!`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Import Completed',
        `Import completed with ${result.successfulImports} successful and ${result.failedImports} failed imports.`,
        [{ text: 'OK' }]
      );
    }
    
    // Refresh the guest list
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelImport = () => {
    setShowContactPicker(false);
  };

  return (
    <View style={styles.container}>
      <GuestList
        key={refreshKey}
        eventId={eventId}
        onAddGuest={handleAddGuest}
        onEditGuest={handleEditGuest}
        onImportContacts={handleImportContacts}
      />

      <GuestForm
        eventId={eventId}
        guest={editingGuest}
        visible={showForm}
        onSave={handleSaveGuest}
        onCancel={handleCancelForm}
      />

      <ContactPicker
        eventId={eventId}
        visible={showContactPicker}
        onImportComplete={handleImportComplete}
        onCancel={handleCancelImport}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GuestManagement;