import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Table, Position } from '../types';

interface TableManagementProps {
  eventId: string;
  onTableSelect?: (table: Table | null) => void;
  onTableChange?: (tables: Table[]) => void;
}

interface TableCapacityInfo {
  tableId: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  isOverCapacity: boolean;
}

const TableManagement: React.FC<TableManagementProps> = ({
  eventId,
  onTableSelect,
  onTableChange
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [capacityInfo, setCapacityInfo] = useState<TableCapacityInfo[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');

  useEffect(() => {
    loadTables();
    loadCapacityInfo();
  }, [eventId]);

  const loadTables = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/tables/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
        onTableChange?.(data);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadCapacityInfo = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/tables/events/${eventId}/capacity`);
      if (response.ok) {
        const data = await response.json();
        setCapacityInfo(data);
      }
    } catch (error) {
      console.error('Error loading capacity info:', error);
    }
  };

  const createTable = async () => {
    if (!newTableName.trim()) {
      Alert.alert('Error', 'Please enter a table name');
      return;
    }

    const capacity = parseInt(newTableCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 20) {
      Alert.alert('Error', 'Please enter a valid capacity (1-20)');
      return;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: newTableName.trim(),
          capacity,
          position: { x: Math.random() * 400, y: Math.random() * 300 } // Random position for mobile
        })
      });

      if (response.ok) {
        const newTable = await response.json();
        const updatedTables = [...tables, newTable];
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        await loadCapacityInfo();
        
        setShowCreateModal(false);
        setNewTableName('');
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
      const response = await fetch(`${config.apiBaseUrl}/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedTable = await response.json();
        const updatedTables = tables.map(t => t.id === tableId ? updatedTable : t);
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        
        if (selectedTable?.id === tableId) {
          setSelectedTable(updatedTable);
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
              const response = await fetch(`${config.apiBaseUrl}/api/tables/${tableId}`, {
                method: 'DELETE'
              });

              if (response.ok) {
                const updatedTables = tables.filter(t => t.id !== tableId);
                setTables(updatedTables);
                onTableChange?.(updatedTables);
                
                if (selectedTable?.id === tableId) {
                  setSelectedTable(null);
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
      const response = await fetch(`${config.apiBaseUrl}/api/tables/${table.id}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        const updatedTable = await response.json();
        const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t);
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        
        if (selectedTable?.id === table.id) {
          setSelectedTable(updatedTable);
        }
        
        Alert.alert('Success', `Table ${action}ed successfully`);
      }
    } catch (error) {
      console.error(`Error ${action}ing table:`, error);
      Alert.alert('Error', `Failed to ${action} table`);
    }
  };

  const duplicateTable = async (tableId: string) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/tables/${tableId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: { x: 50, y: 50 } })
      });

      if (response.ok) {
        const duplicatedTable = await response.json();
        const updatedTables = [...tables, duplicatedTable];
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        await loadCapacityInfo();
        Alert.alert('Success', 'Table duplicated successfully');
      }
    } catch (error) {
      console.error('Error duplicating table:', error);
      Alert.alert('Error', 'Failed to duplicate table');
    }
  };

  const getTableCapacityInfo = (tableId: string) => {
    return capacityInfo.find(info => info.tableId === tableId);
  };

  const handleTablePress = (table: Table) => {
    setSelectedTable(table);
    onTableSelect?.(table);
  };

  const handleEditTable = () => {
    if (selectedTable) {
      setNewTableName(selectedTable.name);
      setNewTableCapacity(selectedTable.capacity.toString());
      setShowEditModal(true);
    }
  };

  const saveTableEdit = async () => {
    if (!selectedTable || !newTableName.trim()) {
      Alert.alert('Error', 'Please enter a table name');
      return;
    }

    const capacity = parseInt(newTableCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 20) {
      Alert.alert('Error', 'Please enter a valid capacity (1-20)');
      return;
    }

    await updateTable(selectedTable.id, {
      name: newTableName.trim(),
      capacity
    });

    setShowEditModal(false);
    setNewTableName('');
    setNewTableCapacity('8');
    Alert.alert('Success', 'Table updated successfully');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Table Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Add Table</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>Total Tables: {tables.length}</Text>
        <Text style={styles.statText}>Locked: {tables.filter(t => t.isLocked).length}</Text>
      </View>

      <ScrollView style={styles.tableList}>
        {tables.map(table => {
          const capacity = getTableCapacityInfo(table.id);
          const isSelected = selectedTable?.id === table.id;
          
          return (
            <TouchableOpacity
              key={table.id}
              style={[
                styles.tableItem,
                isSelected && styles.selectedTableItem,
                capacity?.isOverCapacity && styles.overCapacityItem
              ]}
              onPress={() => handleTablePress(table)}
            >
              <View style={styles.tableInfo}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableName}>{table.name}</Text>
                  {table.isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                <Text style={styles.tableCapacity}>
                  Capacity: {capacity ? `${capacity.occupied}/${capacity.capacity}` : `0/${table.capacity}`}
                  {capacity?.isOverCapacity && ' ⚠️'}
                </Text>
                <Text style={styles.tablePosition}>
                  Position: ({Math.round(table.position.x)}, {Math.round(table.position.y)})
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedTable && (
        <View style={styles.actionPanel}>
          <Text style={styles.actionTitle}>Table Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditTable}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, selectedTable.isLocked ? styles.unlockButton : styles.lockButton]}
              onPress={() => toggleTableLock(selectedTable)}
            >
              <Text style={styles.actionButtonText}>
                {selectedTable.isLocked ? 'Unlock' : 'Lock'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => duplicateTable(selectedTable.id)}
            >
              <Text style={styles.actionButtonText}>Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteTable(selectedTable.id)}
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
              value={newTableName}
              onChangeText={setNewTableName}
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

      {/* Edit Table Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Table</Text>
            
            <Text style={styles.inputLabel}>Table Name</Text>
            <TextInput
              style={styles.textInput}
              value={newTableName}
              onChangeText={setNewTableName}
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
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveTableEdit}
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  tableList: {
    flex: 1,
    padding: 16,
  },
  tableItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTableItem: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  overCapacityItem: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  tableInfo: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lockIcon: {
    fontSize: 16,
  },
  tableCapacity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  tablePosition: {
    fontSize: 12,
    color: '#999',
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

export default TableManagement;