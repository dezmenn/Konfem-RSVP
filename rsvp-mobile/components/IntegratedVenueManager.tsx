import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Switch } from 'react-native';
import { VenueElement, Table, Position } from '../types';
import config from '../config';

interface IntegratedVenueManagerProps {
  eventId: string;
  onElementSelect?: (element: VenueElement | null) => void;
  onTableSelect?: (table: Table | null) => void;
  onLayoutChange?: (elements: VenueElement[], tables: Table[]) => void;
}

interface TableCapacityInfo {
  tableId: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  isOverCapacity: boolean;
}

const IntegratedVenueManager: React.FC<IntegratedVenueManagerProps> = ({
  eventId,
  onElementSelect,
  onTableSelect,
  onLayoutChange
}) => {
  const [elements, setElements] = useState<VenueElement[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ type: 'element' | 'table'; item: VenueElement | Table } | null>(null);
  const [capacityInfo, setCapacityInfo] = useState<TableCapacityInfo[]>([]);
  const [activeMode, setActiveMode] = useState<'venue' | 'tables'>('venue');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    await Promise.all([
      loadVenueLayout(),
      loadTables(),
      loadCapacityInfo()
    ]);
  };

  const loadVenueLayout = async () => {
    try {
      const apiUrl = config.apiBaseUrl + '/api/venue-layout/events/' + eventId;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setElements(data.elements);
      }
    } catch (error) {
      console.error('Error loading venue layout:', error);
    }
  };

  const loadTables = async () => {
    try {
      const apiUrl = config.apiBaseUrl + '/api/tables/events/' + eventId;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadCapacityInfo = async () => {
    try {
      const apiUrl = config.apiBaseUrl + '/api/tables/events/' + eventId + '/capacity';
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setCapacityInfo(data);
      }
    } catch (error) {
      console.error('Error loading capacity info:', error);
    }
  };

  const validateLayout = async () => {
    try {
      const venueUrl = config.apiBaseUrl + '/api/venue-layout/events/' + eventId + '/validate';
      const tableUrl = config.apiBaseUrl + '/api/tables/events/' + eventId + '/validate';
      const [venueResponse, tableResponse] = await Promise.all([
        fetch(venueUrl),
        fetch(tableUrl)
      ]);

      const venueValidation = venueResponse.ok ? await venueResponse.json() : { isValid: true, errors: [], warnings: [] };
      const tableValidation = tableResponse.ok ? await tableResponse.json() : { isValid: true, errors: [], warnings: [] };

      const allErrors = [...(venueValidation.errors || []), ...(tableValidation.errors || [])];
      const allWarnings = [...(venueValidation.warnings || []), ...(tableValidation.warnings || [])];
      const isValid = venueValidation.isValid && tableValidation.isValid;

      let message = isValid ? 'Layout is valid!' : 'Layout has issues:';
      if (allErrors.length > 0) {
        message += '\n\nErrors:\n' + allErrors.join('\n');
      }
      if (allWarnings.length > 0) {
        message += '\n\nWarnings:\n' + allWarnings.join('\n');
      }

      Alert.alert('Layout Validation', message);
    } catch (error) {
      console.error('Error validating layout:', error);
      Alert.alert('Error', 'Failed to validate layout');
    }
  };

  // Table operations
  const createTable = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter a table name');
      return;
    }

    const capacity = parseInt(newTableCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 20) {
      Alert.alert('Error', 'Please enter a valid capacity (1-20)');
      return;
    }

    try {
      const apiUrl = config.apiBaseUrl + '/api/tables';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: newItemName.trim(),
          capacity,
          position: { x: Math.random() * 400, y: Math.random() * 300 }
        })
      });

      if (response.ok) {
        const newTable = await response.json();
        const updatedTables = [...tables, newTable];
        setTables(updatedTables);
        onLayoutChange?.(elements, updatedTables);
        await loadCapacityInfo();
        
        setShowCreateModal(false);
        setNewItemName('');
        setNewTableCapacity('8');
        Alert.alert('Success', 'Table created successfully');
      }
    } catch (error) {
      console.error('Error creating table:', error);
      Alert.alert('Error', 'Failed to create table');
    }
  };

  const updateTable = async (tableId: string, updates: Partial<Table>) => {
    try {
      const apiUrl = config.apiBaseUrl + '/api/tables/' + tableId;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedTable = await response.json();
        const updatedTables = tables.map(t => t.id === tableId ? updatedTable : t);
        setTables(updatedTables);
        onLayoutChange?.(elements, updatedTables);
        
        if (selectedItem?.type === 'table' && (selectedItem.item as Table).id === tableId) {
          setSelectedItem({ type: 'table', item: updatedTable });
        }
        
        await loadCapacityInfo();
        return updatedTable;
      }
    } catch (error) {
      console.error('Error updating table:', error);
      Alert.alert('Error', 'Failed to update table');
    }
  };

  const deleteTable = async (tableId: string) => {
    Alert.alert(
      'Delete Table',
      'Are you sure you want to delete this table? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const apiUrl = config.apiBaseUrl + '/api/tables/' + tableId;
              const response = await fetch(apiUrl, {
                method: 'DELETE'
              });

              if (response.ok) {
                const updatedTables = tables.filter(t => t.id !== tableId);
                setTables(updatedTables);
                onLayoutChange?.(elements, updatedTables);
                
                if (selectedItem?.type === 'table' && (selectedItem.item as Table).id === tableId) {
                  setSelectedItem(null);
                  onTableSelect?.(null);
                }
                
                await loadCapacityInfo();
                Alert.alert('Success', 'Table deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete table. It may have assigned guests.');
              }
            } catch (error) {
              console.error('Error deleting table:', error);
              Alert.alert('Error', 'Failed to delete table');
            }
          }
        }
      ]
    );
  };

  const toggleTableLock = async (table: Table) => {
    const action = table.isLocked ? 'unlock' : 'lock';
    try {
      const apiUrl = config.apiBaseUrl + '/api/tables/' + table.id + '/' + action;
      const response = await fetch(apiUrl, {
        method: 'POST'
      });

      if (response.ok) {
        const updatedTable = await response.json();
        const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
        setTables(updatedTables);
        onLayoutChange?.(elements, updatedTables);
        
        if (selectedItem?.type === 'table' && (selectedItem.item as Table).id === table.id) {
          setSelectedItem({ type: 'table', item: updatedTable });
        }
        
        Alert.alert('Success', 'Table ' + action + 'ed successfully');
      }
    } catch (error) {
      console.error('Error ' + action + 'ing table:', error);
      Alert.alert('Error', 'Failed to ' + action + ' table');
    }
  };

  // Element operations
  const deleteElement = async (elementId: string) => {
    Alert.alert(
      'Delete Element',
      'Are you sure you want to delete this venue element?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const apiUrl = config.apiBaseUrl + '/api/venue-layout/elements/' + elementId;
              const response = await fetch(apiUrl, {
                method: 'DELETE'
              });

              if (response.ok) {
                const updatedElements = elements.filter(el => el.id !== elementId);
                setElements(updatedElements);
                onLayoutChange?.(updatedElements, tables);
                
                if (selectedItem?.type === 'element' && (selectedItem.item as VenueElement).id === elementId) {
                  setSelectedItem(null);
                  onElementSelect?.(null);
                }
                
                Alert.alert('Success', 'Element deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting element:', error);
              Alert.alert('Error', 'Failed to delete element');
            }
          }
        }
      ]
    );
  };

  const handleItemPress = (item: VenueElement | Table, type: 'element' | 'table') => {
    setSelectedItem({ type, item });
    if (type === 'element') {
      onElementSelect?.(item as VenueElement);
    } else {
      onTableSelect?.(item as Table);
    }
  };

  const handleEditItem = () => {
    if (selectedItem) {
      setNewItemName(selectedItem.item.name);
      if (selectedItem.type === 'table') {
        setNewTableCapacity((selectedItem.item as Table).capacity.toString());
      }
      setShowEditModal(true);
    }
  };

  const saveItemEdit = async () => {
    if (!selectedItem || !newItemName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (selectedItem.type === 'table') {
      const capacity = parseInt(newTableCapacity);
      if (isNaN(capacity) || capacity < 1 || capacity > 20) {
        Alert.alert('Error', 'Please enter a valid capacity (1-20)');
        return;
      }

      await updateTable((selectedItem.item as Table).id, {
        name: newItemName.trim(),
        capacity
      });
    } else {
      // Update venue element
      try {
        const apiUrl = config.apiBaseUrl + '/api/venue-layout/elements/' + selectedItem.item.id;
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newItemName.trim() })
        });

        if (response.ok) {
          const updatedElement = await response.json();
          const updatedElements = elements.map(el => el.id === selectedItem.item.id ? updatedElement : el);
          setElements(updatedElements);
          onLayoutChange?.(updatedElements, tables);
          setSelectedItem({ type: 'element', item: updatedElement });
        }
      } catch (error) {
        console.error('Error updating element:', error);
        Alert.alert('Error', 'Failed to update element');
      }
    }

    setShowEditModal(false);
    setNewItemName('');
    setNewTableCapacity('8');
    Alert.alert('Success', 'Item updated successfully');
  };

  const getTableCapacityInfo = (tableId: string) => {
    return capacityInfo.find(info => info.tableId === tableId);
  };

  const renderVenueElements = () => (
    <ScrollView style={styles.itemList}>
      {elements.map(element => {
        const isSelected = selectedItem?.type === 'element' && selectedItem.item.id === element.id;
        
        return (
          <TouchableOpacity
            key={element.id}
            style={[styles.itemCard, isSelected && styles.selectedItem]}
            onPress={() => handleItemPress(element, 'element')}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{element.name}</Text>
              <View style={[styles.elementTypeIndicator, { backgroundColor: element.color }]}>
                <Text style={styles.elementType}>{element.type}</Text>
              </View>
            </View>
            <Text style={styles.itemDetails}>
              Position: ({Math.round(element.position.x)}, {Math.round(element.position.y)})
            </Text>
            <Text style={styles.itemDetails}>
              Size: {Math.round(element.dimensions.width)} × {Math.round(element.dimensions.height)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderTables = () => (
    <ScrollView style={styles.itemList}>
      {tables.map(table => {
        const capacity = getTableCapacityInfo(table.id);
        const isSelected = selectedItem?.type === 'table' && (selectedItem.item as Table).id === table.id;
        
        return (
          <TouchableOpacity
            key={table.id}
            style={[
              styles.itemCard,
              isSelected && styles.selectedItem,
              capacity?.isOverCapacity && styles.overCapacityItem
            ]}
            onPress={() => handleItemPress(table, 'table')}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{table.name}</Text>
              <View style={styles.tableIndicators}>
                {table.isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                {capacity?.isOverCapacity && <Text style={styles.warningIcon}>⚠️</Text>}
              </View>
            </View>
            <Text style={styles.itemDetails}>
              Capacity: {capacity ? `${capacity.occupied}/${capacity.capacity}` : `0/${table.capacity}`}
            </Text>
            <Text style={styles.itemDetails}>
              Position: ({Math.round(table.position.x)}, {Math.round(table.position.y)})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Venue & Tables</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.validateButton}
            onPress={validateLayout}
          >
            <Text style={styles.validateButtonText}>Validate</Text>
          </TouchableOpacity>
          {activeMode === 'tables' && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>+ Table</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'venue' && styles.activeModeButton]}
          onPress={() => setActiveMode('venue')}
        >
          <Text style={[styles.modeButtonText, activeMode === 'venue' && styles.activeModeButtonText]}>
            Venue Elements ({elements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'tables' && styles.activeModeButton]}
          onPress={() => setActiveMode('tables')}
        >
          <Text style={[styles.modeButtonText, activeMode === 'tables' && styles.activeModeButtonText]}>
            Tables ({tables.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'venue' ? renderVenueElements() : renderTables()}

      {selectedItem && (
        <View style={styles.actionPanel}>
          <Text style={styles.actionTitle}>
            {selectedItem.type === 'element' ? 'Element' : 'Table'} Actions
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditItem}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            {selectedItem.type === 'table' && (
              <TouchableOpacity
                style={[styles.actionButton, (selectedItem.item as Table).isLocked ? styles.unlockButton : styles.lockButton]}
                onPress={() => toggleTableLock(selectedItem.item as Table)}
              >
                <Text style={styles.actionButtonText}>
                  {(selectedItem.item as Table).isLocked ? 'Unlock' : 'Lock'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => {
                if (selectedItem.type === 'table') {
                  deleteTable((selectedItem.item as Table).id);
                } else {
                  deleteElement(selectedItem.item.id);
                }
              }}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Create Table Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Table</Text>
            
            <Text style={styles.inputLabel}>Table Name</Text>
            <TextInput
              style={styles.textInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Enter table name"
            />
            
            <Text style={styles.inputLabel}>Capacity</Text>
            <TextInput
              style={styles.textInput}
              value={newTableCapacity}
              onChangeText={setNewTableCapacity}
              placeholder="Enter capacity (1-20)"
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={createTable}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {selectedItem?.type === 'element' ? 'Element' : 'Table'}
            </Text>
            
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Enter name"
            />
            
            {selectedItem?.type === 'table' && (
              <>
                <Text style={styles.inputLabel}>Capacity</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTableCapacity}
                  onChangeText={setNewTableCapacity}
                  placeholder="Enter capacity (1-20)"
                  keyboardType="numeric"
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveItemEdit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  validateButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  validateButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeModeButton: {
    borderBottomColor: '#2196F3',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeModeButtonText: {
    color: '#2196F3',
  },
  itemList: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedItem: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  overCapacityItem: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  elementTypeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  elementType: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  tableIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  lockIcon: {
    fontSize: 16,
  },
  warningIcon: {
    fontSize: 16,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  actionPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  lockButton: {
    backgroundColor: '#FF9800',
  },
  unlockButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default IntegratedVenueManager;