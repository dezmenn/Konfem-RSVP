import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Table, Guest } from '../types';

interface AutoTableArrangementProps {
  eventId: string;
  tables: Table[];
  onTablesChange: (tables: Table[]) => void;
}

interface GuestWithTable extends Guest {
  tableId?: string;
}

interface AutoArrangementOptions {
  respectRelationships: boolean;
  considerDietaryRestrictions: boolean;
  keepFamiliesTogether: boolean;
}

const AutoTableArrangement: React.FC<AutoTableArrangementProps> = ({
  eventId,
  tables,
  onTablesChange
}) => {
  const [guests, setGuests] = useState<GuestWithTable[]>([]);
  const [seatedGuests, setSeatedGuests] = useState<GuestWithTable[]>([]);
  const [unseatedGuests, setUnseatedGuests] = useState<GuestWithTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [autoOptions, setAutoOptions] = useState<AutoArrangementOptions>({
    respectRelationships: true,
    considerDietaryRestrictions: false,
    keepFamiliesTogether: true
  });
  const [isArranging, setIsArranging] = useState(false);

  // Load guests and categorize them
  useEffect(() => {
    loadGuests();
  }, [eventId]);

  useEffect(() => {
    categorizeGuests();
  }, [guests, tables]);

  const loadGuests = async () => {
    try {
      const response = await fetch(`/api/guests/events/${eventId}`);
      if (response.ok) {
        const guestData = await response.json();
        setGuests(guestData);
      }
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const categorizeGuests = () => {
    const seated: GuestWithTable[] = [];
    const unseated: GuestWithTable[] = [];

    guests.forEach(guest => {
      if (guest.tableAssignment) {
        seated.push({ ...guest, tableId: guest.tableAssignment });
      } else {
        unseated.push(guest);
      }
    });

    setSeatedGuests(seated);
    setUnseatedGuests(unseated);
  };

  const getGuestsByTable = (tableId: string): GuestWithTable[] => {
    return seatedGuests.filter(guest => guest.tableId === tableId);
  };

  const getTableCapacityInfo = (table: Table) => {
    const assignedGuests = getGuestsByTable(table.id);
    return {
      occupied: assignedGuests.length,
      available: table.capacity - assignedGuests.length,
      isOverCapacity: assignedGuests.length > table.capacity
    };
  };

  // Auto-arrangement algorithm
  const performAutoArrangement = async () => {
    setIsArranging(true);
    
    try {
      // First, unassign all guests from tables
      await Promise.all(
        seatedGuests.map(guest => unassignGuestFromTable(guest.id))
      );

      // Get all unassigned guests
      const allGuests = [...guests];
      const availableTables = [...tables].filter(t => !t.isLocked);
      
      if (availableTables.length === 0) {
        Alert.alert('Error', 'No unlocked tables available for auto-arrangement');
        return;
      }

      // Group guests by relationship and side
      const guestGroups = groupGuestsForArrangement(allGuests);
      
      // Assign groups to tables
      await assignGroupsToTables(guestGroups, availableTables);
      
      // Reload guests to reflect changes
      await loadGuests();
      
      Alert.alert('Success', 'Auto-arrangement completed successfully!');
    } catch (error) {
      console.error('Error during auto-arrangement:', error);
      Alert.alert('Error', 'Auto-arrangement failed. Please try again.');
    } finally {
      setIsArranging(false);
    }
  };

  const groupGuestsForArrangement = (allGuests: Guest[]) => {
    const groups: Guest[][] = [];
    const processed = new Set<string>();

    // Group families together if option is enabled
    if (autoOptions.keepFamiliesTogether) {
      const familyGroups = new Map<string, Guest[]>();
      
      allGuests.forEach(guest => {
        if (processed.has(guest.id)) return;
        
        // Create family key based on relationship type and side
        const familyKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
        
        if (!familyGroups.has(familyKey)) {
          familyGroups.set(familyKey, []);
        }
        
        familyGroups.get(familyKey)!.push(guest);
        processed.add(guest.id);
      });

      // Convert family groups to arrays - no splitting needed since we use individual table capacities
      familyGroups.forEach(family => {
        groups.push(family);
      });
    } else {
      // Simple grouping without family consideration - create individual groups
      allGuests.forEach(guest => {
        if (!processed.has(guest.id)) {
          groups.push([guest]);
          processed.add(guest.id);
        }
      });
    }

    return groups;
  };

  const assignGroupsToTables = async (groups: Guest[][], availableTables: Table[]) => {
    let tableIndex = 0;
    
    for (const group of groups) {
      if (tableIndex >= availableTables.length) {
        console.warn('Not enough tables for all guest groups');
        break;
      }

      const table = availableTables[tableIndex];
      
      // Assign each guest in the group to the current table
      for (const guest of group) {
        if (getTableCapacityInfo(table).available > 0) {
          await assignGuestToTable(guest.id, table.id);
        } else {
          // Move to next table if current is full
          tableIndex++;
          if (tableIndex < availableTables.length) {
            await assignGuestToTable(guest.id, availableTables[tableIndex].id);
          }
        }
      }
      
      tableIndex++;
    }
  };

  // Guest assignment functions
  const assignGuestToTable = async (guestId: string, tableId: string) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/assign-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      });

      if (!response.ok) {
        throw new Error('Failed to assign guest to table');
      }
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      throw error;
    }
  };

  const unassignGuestFromTable = async (guestId: string) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/unassign-table`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to unassign guest from table');
      }
    } catch (error) {
      console.error('Error unassigning guest from table:', error);
      throw error;
    }
  };

  const handleGuestAssignment = async (guestId: string, tableId: string) => {
    try {
      const guest = guests.find(g => g.id === guestId);
      if (!guest) return;

      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      const capacityInfo = getTableCapacityInfo(table);
      if (capacityInfo.available <= 0 && guest.tableAssignment !== tableId) {
        Alert.alert('Error', `Table "${table.name}" is at full capacity`);
        return;
      }

      // If guest is moving from another table, unassign first
      if (guest.tableAssignment && guest.tableAssignment !== tableId) {
        await unassignGuestFromTable(guest.id);
      }

      // Assign to new table
      if (guest.tableAssignment !== tableId) {
        await assignGuestToTable(guest.id, tableId);
        await loadGuests(); // Refresh guest list
      }
    } catch (error) {
      console.error('Error handling guest assignment:', error);
      Alert.alert('Error', 'Failed to assign guest to table');
    }
  };

  const handleGuestUnassignment = async (guestId: string) => {
    try {
      await unassignGuestFromTable(guestId);
      await loadGuests(); // Refresh guest list
    } catch (error) {
      console.error('Error handling guest unassignment:', error);
      Alert.alert('Error', 'Failed to unassign guest from table');
    }
  };

  const resetAllAssignments = async () => {
    Alert.alert(
      'Reset All Assignments',
      'Are you sure you want to unassign all guests from their tables? Guests in locked tables will not be affected. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset All', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting reset all assignments...');
              
              // Get all currently assigned guests, excluding those in locked tables
              const assignedGuests = guests.filter(guest => {
                if (!guest.tableAssignment) {
                  return false; // Guest is not assigned to any table
                }

                // Check if the guest is in a locked table
                const assignedTable = tables.find(table => table.id === guest.tableAssignment);
                if (assignedTable && assignedTable.isLocked) {
                  console.log(`Skipping guest ${guest.name} - assigned to locked table "${assignedTable.name}"`);
                  return false; // Skip guests in locked tables
                }

                return true; // Include this guest for reset
              });

              if (assignedGuests.length === 0) {
                Alert.alert('Info', 'No guests are currently assigned to tables.');
                return;
              }

              console.log(`Found ${assignedGuests.length} assigned guests to unassign`);

              // Unassign all guests
              for (const guest of assignedGuests) {
                await unassignGuestFromTable(guest.id);
              }

              // Refresh guest list
              await loadGuests();
              
              Alert.alert('Success', `Successfully unassigned ${assignedGuests.length} guests from their tables.`);
              console.log('✅ Reset all assignments completed successfully');
              
            } catch (error) {
              console.error('❌ Error resetting all assignments:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', `Failed to reset all assignments: ${errorMessage}`);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Table Arrangement Manager</Text>
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, isArranging && styles.disabledButton]}
            onPress={performAutoArrangement}
            disabled={isArranging}
          >
            <Text style={styles.buttonText}>
              {isArranging ? 'Arranging...' : 'Auto Arrange'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={loadGuests}>
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={resetAllAssignments}>
            <Text style={styles.buttonText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionsSection}>
        <Text style={styles.sectionTitle}>Auto-Arrangement Options</Text>
        <View style={styles.optionsGrid}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => setAutoOptions(prev => ({
              ...prev,
              respectRelationships: !prev.respectRelationships
            }))}
          >
            <Text style={styles.checkbox}>
              {autoOptions.respectRelationships ? '☑️' : '☐'}
            </Text>
            <Text style={styles.optionText}>Respect Relationships</Text>
          </TouchableOpacity>
          

          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => setAutoOptions(prev => ({
              ...prev,
              keepFamiliesTogether: !prev.keepFamiliesTogether
            }))}
          >
            <Text style={styles.checkbox}>
              {autoOptions.keepFamiliesTogether ? '☑️' : '☐'}
            </Text>
            <Text style={styles.optionText}>Keep Families Together</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.guestSection}>
        <Text style={styles.sectionTitle}>Unseated Guests ({unseatedGuests.length})</Text>
        <ScrollView style={styles.guestList} nestedScrollEnabled>
          {unseatedGuests.map(guest => (
            <View key={guest.id} style={styles.guestItem}>
              <View style={styles.guestInfo}>
                <Text style={styles.guestName}>{guest.name}</Text>
                <View style={styles.guestDetails}>
                  <Text style={styles.guestSide}>{guest.brideOrGroomSide}</Text>
                  <Text style={styles.guestRelationship}>{guest.relationshipType}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.assignButton}
                onPress={() => {
                  // Show table selection for assignment
                  Alert.alert(
                    'Assign to Table',
                    'Select a table for this guest',
                    tables.map(table => ({
                      text: `${table.name} (${getTableCapacityInfo(table).occupied}/${table.capacity})`,
                      onPress: () => handleGuestAssignment(guest.id, table.id)
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                  );
                }}
              >
                <Text style={styles.assignButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tablesSection}>
        <Text style={styles.sectionTitle}>Tables</Text>
        <ScrollView style={styles.tableList} nestedScrollEnabled>
          {tables.map(table => {
            const tableGuests = getGuestsByTable(table.id);
            const capacityInfo = getTableCapacityInfo(table);
            
            return (
              <View 
                key={table.id} 
                style={[
                  styles.tableCard,
                  capacityInfo.isOverCapacity && styles.overCapacityTable,
                  table.isLocked && styles.lockedTable
                ]}
              >
                <View style={styles.tableHeader}>
                  <Text style={styles.tableName}>{table.name}</Text>
                  <Text style={styles.tableCapacity}>
                    {capacityInfo.occupied}/{table.capacity}
                    {table.isLocked && ' 🔒'}
                  </Text>
                </View>
                <View style={styles.tableGuests}>
                  {tableGuests.map(guest => (
                    <TouchableOpacity
                      key={guest.id}
                      style={styles.tableGuest}
                      onPress={() => {
                        Alert.alert(
                          'Guest Options',
                          `What would you like to do with ${guest.name}?`,
                          [
                            { text: 'Unassign', onPress: () => handleGuestUnassignment(guest.id) },
                            { text: 'Move to Another Table', onPress: () => {
                              Alert.alert(
                                'Move to Table',
                                'Select a new table',
                                tables.filter(t => t.id !== table.id).map(t => ({
                                  text: `${t.name} (${getTableCapacityInfo(t).occupied}/${t.capacity})`,
                                  onPress: () => handleGuestAssignment(guest.id, t.id)
                                })).concat([{ text: 'Cancel', style: 'cancel' }])
                              );
                            }},
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      }}
                    >
                      <View style={styles.tableGuestInfo}>
                        <Text style={styles.tableGuestText}>{guest.name}</Text>
                        <Text style={styles.tableGuestRelationship}>{guest.relationshipType}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                {capacityInfo.available > 0 && (
                  <Text style={styles.dropHint}>
                    {capacityInfo.available} spots available
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Guests</Text>
          <Text style={styles.statValue}>{guests.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Seated</Text>
          <Text style={styles.statValue}>{seatedGuests.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Unseated</Text>
          <Text style={styles.statValue}>{unseatedGuests.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tables</Text>
          <Text style={styles.statValue}>{tables.length}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  optionsSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  optionsGrid: {
    gap: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    fontSize: 18,
  },
  optionText: {
    fontSize: 16,
    color: '#555',
  },
  guestSection: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    maxHeight: 300,
  },
  guestList: {
    padding: 10,
  },
  guestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  guestDetails: {
    flexDirection: 'row',
    gap: 10,
  },
  guestSide: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 12,
    fontWeight: '500',
  },
  guestRelationship: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 12,
  },
  assignButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tablesSection: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    maxHeight: 400,
  },
  tableList: {
    padding: 10,
  },
  tableCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  overCapacityTable: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  lockedTable: {
    borderColor: '#9e9e9e',
    backgroundColor: '#f5f5f5',
    opacity: 0.8,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tableCapacity: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tableGuests: {
    gap: 6,
    marginBottom: 10,
  },
  tableGuest: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minHeight: 22,
  },
  tableGuestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableGuestText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  tableGuestRelationship: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 11,
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  dropHint: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AutoTableArrangement;