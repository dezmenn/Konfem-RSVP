import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Platform,
  Switch,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  LongPressGestureHandler,
  TapGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { config } from '../config';
import { VenueElement, Position, Dimensions as VenueDimensions, Table, Guest } from '../types';
import { GestureResponderEvent } from 'react-native';

interface MobileVenueLayoutManagerProps {
  eventId: string;
  onElementSelect?: (element: VenueElement | null) => void;
  onTableSelect?: (table: Table | null) => void;
  onLayoutChange?: (layout: VenueLayout) => void;
}

export interface VenueLayout {
  elements: VenueElement[];
  tables: Table[];
}

interface VenueElementLibraryItem {
  type: VenueElement['type'];
  name: string;
  defaultDimensions: VenueDimensions;
  defaultColor: string;
  description: string;
  icon: string;
}

interface GestureState {
  scale: number;
  translateX: number;
  translateY: number;
  isGesturing: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const MobileVenueLayoutManager: React.FC<MobileVenueLayoutManagerProps> = ({
  eventId,
  onElementSelect,
  onTableSelect,
  onLayoutChange
}) => {
  // Core state
  const [mode, setMode] = useState<'layout' | 'tables' | 'arrangement'>('layout');
  const [elements, setElements] = useState<VenueElement[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ type: 'element' | 'table'; item: VenueElement | Table } | null>(null);

  // UI state
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showAutoArrangement, setShowAutoArrangement] = useState(false);
  const [showTableCreation, setShowTableCreation] = useState(false);
  const [propertiesModalView, setPropertiesModalView] = useState<'guests' | 'properties'>('guests');
  const [gestureState, setGestureState] = useState<GestureState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isGesturing: false
  });

  // Drag state for simple implementation
  const [draggedItem, setDraggedItem] = useState<{ type: 'element' | 'table'; item: VenueElement | Table; startPos: Position } | null>(null);

  // Auto arrangement options
  const [autoOptions, setAutoOptions] = useState({
    respectRelationships: true,
    keepFamiliesTogether: true,
    considerDietaryRestrictions: false
  });

  // Additional missing state variables
  const [isArranging, setIsArranging] = useState(false);
  const [stats, setStats] = useState({
    totalGuests: 0,
    seatedGuests: 0,
    unseatedGuests: 0
  });
  const [success, setSuccess] = useState<string | null>(null);

  // Simple drag tracking

  // Refs for gesture handlers
  const canvasPanRef = useRef(null);
  const canvasPinchRef = useRef(null);

  // Library data
  const [library] = useState<VenueElementLibraryItem[]>([
    {
      type: 'stage',
      name: 'Stage',
      defaultDimensions: { width: 120, height: 80 },
      defaultColor: '#8e24aa',
      description: 'Main stage area',
      icon: '🎭'
    },
    {
      type: 'dance_floor',
      name: 'Dance Floor',
      defaultDimensions: { width: 100, height: 100 },
      defaultColor: '#1976d2',
      description: 'Dance floor area',
      icon: '💃'
    },
    {
      type: 'bar',
      name: 'Bar',
      defaultDimensions: { width: 80, height: 40 },
      defaultColor: '#d32f2f',
      description: 'Bar counter',
      icon: '🍸'
    },
    {
      type: 'entrance',
      name: 'Entrance',
      defaultDimensions: { width: 60, height: 20 },
      defaultColor: '#388e3c',
      description: 'Main entrance',
      icon: '🚪'
    },
    {
      type: 'walkway',
      name: 'Walkway',
      defaultDimensions: { width: 200, height: 30 },
      defaultColor: '#795548',
      description: 'Walking path',
      icon: '🛤️'
    },
    {
      type: 'decoration',
      name: 'Decoration',
      defaultDimensions: { width: 40, height: 40 },
      defaultColor: '#ff9800',
      description: 'Decorative element',
      icon: '🌸'
    }
  ]);

  useEffect(() => {
    loadData();
  }, [eventId]);

  // Add sample data for demonstration if no data exists
  useEffect(() => {
    if (elements.length === 0 && tables.length === 0) {
      // Add sample elements for demonstration
      const sampleElements: VenueElement[] = [
        {
          id: 'sample-stage',
          eventId,
          type: 'stage',
          name: 'Main Stage',
          position: { x: 300, y: 50 },
          dimensions: { width: 200, height: 100 },
          color: '#8e24aa'
        },
        {
          id: 'sample-dancefloor',
          eventId,
          type: 'dance_floor',
          name: 'Dance Floor',
          position: { x: 250, y: 200 },
          dimensions: { width: 150, height: 150 },
          color: '#1976d2'
        },
        {
          id: 'sample-bar',
          eventId,
          type: 'bar',
          name: 'Main Bar',
          position: { x: 50, y: 100 },
          dimensions: { width: 120, height: 60 },
          color: '#d32f2f'
        }
      ];

      // Add sample tables for demonstration
      const sampleTables: Table[] = [
        {
          id: 'sample-table-1',
          eventId,
          name: 'Table 1',
          capacity: 8,
          position: { x: 100, y: 300 },
          assignedGuests: [],
          isLocked: false
        },
        {
          id: 'sample-table-2',
          eventId,
          name: 'Table 2',
          capacity: 6,
          position: { x: 300, y: 400 },
          assignedGuests: [],
          isLocked: false
        },
        {
          id: 'sample-table-3',
          eventId,
          name: 'Table 3',
          capacity: 10,
          position: { x: 500, y: 350 },
          assignedGuests: [],
          isLocked: false
        }
      ];

      setElements(sampleElements);
      setTables(sampleTables);
      onLayoutChange?.({ elements: sampleElements, tables: sampleTables });
    }
  }, [elements.length, tables.length, eventId, onLayoutChange]);

  useEffect(() => {
    // Listen for dimension changes for responsive scaling
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setGestureState(prev => ({
        ...prev,
        scale: Math.min(prev.scale, MAX_SCALE * (window.width / screenWidth))
      }));
    });

    return () => subscription?.remove();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadVenueLayout(),
      loadTables(),
      loadGuests()
    ]);
  };

  const loadVenueLayout = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setElements(data.elements || []);
      }
    } catch (error) {
      console.error('Error loading venue layout:', error);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/tables/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data || []);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadGuests = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/guests/${eventId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGuests(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  // Simplified canvas style without complex animations
  const canvasStyle = {
    transform: [
      { scale: gestureState.scale },
      { translateX: gestureState.translateX },
      { translateY: gestureState.translateY },
    ],
  };

  const resetView = () => {
    setGestureState({ scale: 1, translateX: 0, translateY: 0, isGesturing: false });
  };

  const zoomIn = () => {
    const newScale = Math.min(MAX_SCALE, gestureState.scale * 1.5);
    setGestureState(prev => ({ ...prev, scale: newScale }));
  };

  const zoomOut = () => {
    const newScale = Math.max(MIN_SCALE, gestureState.scale / 1.5);
    setGestureState(prev => ({ ...prev, scale: newScale }));
  };

  const createElementFromLibrary = async (libraryItem: VenueElementLibraryItem) => {
    try {
      // Place element at center of visible area
      const centerX = (screenWidth / 2 - gestureState.translateX) / gestureState.scale;
      const centerY = (screenHeight / 2 - gestureState.translateY) / gestureState.scale;

      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/events/${eventId}/elements/from-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: libraryItem.type,
          name: libraryItem.name,
          position: { x: centerX, y: centerY }
        })
      });

      if (response.ok) {
        const newElement = await response.json();
        const updatedElements = [...elements, newElement];
        setElements(updatedElements);
        onLayoutChange?.({ elements: updatedElements, tables });
        setShowLibrary(false);
        Alert.alert('Success', `${libraryItem.name} added to venue`);
      }
    } catch (error) {
      console.error('Error creating element:', error);
      Alert.alert('Error', 'Failed to create element');
    }
  };

  const createTable = async (position: Position) => {
    try {
      const newTable = {
        eventId,
        name: `Table ${tables.length + 1}`,
        capacity: 8,
        position
      };

      const response = await fetch(`${config.apiBaseUrl}/api/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable)
      });

      if (response.ok) {
        const createdTable = await response.json();
        const updatedTables = [...tables, createdTable];
        setTables(updatedTables);
        onLayoutChange?.({ elements, tables: updatedTables });
        Alert.alert('Success', 'Table created successfully');
      }
    } catch (error) {
      console.error('Error creating table:', error);
      Alert.alert('Error', 'Failed to create table');
    }
  };

  // Auto arrangement functionality
  const performAutoArrangement = async () => {
    setIsArranging(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/tables/events/${eventId}/auto-arrange-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constraints: autoOptions })
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', result.message);
        await loadData(); // Refresh all data
      } else {
        Alert.alert('Error', `Auto-arrangement failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error during auto-arrangement:', error);
      Alert.alert('Error', 'Auto-arrangement failed. Please try again.');
    } finally {
      setIsArranging(false);
    }
  };

  // Guest assignment functions
  const assignGuestToTable = async (guestId: string, tableId: string) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/guests/${guestId}/assign-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      });

      if (response.ok) {
        await loadData(); // Refresh data
        Alert.alert('Success', 'Guest assigned to table');
      } else {
        const error = await response.json();
        Alert.alert('Error', `Failed to assign guest: ${error.error}`);
      }
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      Alert.alert('Error', 'Failed to assign guest to table');
    }
  };

  const unassignGuestFromTable = async (guestId: string) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/guests/${guestId}/unassign-table`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData(); // Refresh data
        Alert.alert('Success', 'Guest unassigned from table');
      } else {
        const error = await response.json();
        Alert.alert('Error', `Failed to unassign guest: ${error.error}`);
      }
    } catch (error) {
      console.error('Error unassigning guest from table:', error);
      Alert.alert('Error', 'Failed to unassign guest from table');
    }
  };

  const resetAllAssignments = async () => {
    Alert.alert(
      'Reset All Assignments',
      'Are you sure you want to unassign all guests from their tables? Guests in locked tables will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              const assignedGuests = guests.filter(guest => {
                if (!guest.tableAssignment) return false;
                const assignedTable = tables.find(table => table.id === guest.tableAssignment);
                return !assignedTable?.isLocked;
              });

              if (assignedGuests.length === 0) {
                Alert.alert('Info', 'No guests are currently assigned to tables.');
                return;
              }

              const response = await fetch(`${config.apiBaseUrl}/api/guests/bulk-unassign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  guestIds: assignedGuests.map(g => g.id)
                })
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert('Success', `Successfully unassigned ${result.data.successfulUnassignments} guests from their tables.`);
                await loadData();
              } else {
                throw new Error(result.error || 'Reset all assignments failed');
              }
            } catch (error) {
              console.error('Error resetting all assignments:', error);
              Alert.alert('Error', 'Failed to reset all assignments');
            }
          }
        }
      ]
    );
  };

  const deleteElement = async (elementId: string) => {
    Alert.alert(
      'Delete Element',
      'Are you sure you want to delete this element?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/elements/${elementId}`, {
                method: 'DELETE'
              });

              if (response.ok) {
                const updatedElements = elements.filter(el => el.id !== elementId);
                setElements(updatedElements);
                onLayoutChange?.({ elements: updatedElements, tables });

                if (selectedItem?.type === 'element' && (selectedItem.item as VenueElement).id === elementId) {
                  setSelectedItem(null);
                  onElementSelect?.(null);
                  setShowProperties(false);
                }

                Alert.alert('Success', 'Element deleted');
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

  const deleteTable = async (tableId: string) => {
    Alert.alert(
      'Delete Table',
      'Are you sure you want to delete this table? All assigned guests will be unassigned.',
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
                onLayoutChange?.({ elements, tables: updatedTables });

                if (selectedItem?.type === 'table' && (selectedItem.item as Table).id === tableId) {
                  setSelectedItem(null);
                  onTableSelect?.(null);
                  setShowProperties(false);
                }

                Alert.alert('Success', 'Table deleted');
                await loadGuests(); // Refresh guests to update assignments
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

  const toggleTableLock = async (tableId: string) => {
    try {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      const endpoint = table.isLocked ? 'unlock' : 'lock';
      const response = await fetch(`${config.apiBaseUrl}/api/tables/${tableId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await loadTables();
        const action = table.isLocked ? 'unlocked' : 'locked';
        Alert.alert('Success', `Table "${table.name}" has been ${action}`);
      } else {
        throw new Error('Failed to toggle table lock');
      }
    } catch (error) {
      console.error('Error toggling table lock:', error);
      Alert.alert('Error', 'Failed to toggle table lock');
    }
  };

  // Helper functions
  const getGuestsForTable = (tableId: string): Guest[] => {
    return guests.filter(guest => guest.tableAssignment === tableId);
  };

  const getTableCapacityInfo = (table: Table) => {
    const assignedGuests = getGuestsForTable(table.id);
    const totalSeatsNeeded = assignedGuests.reduce((sum, guest) => sum + 1 + (guest.additionalGuestCount || 0), 0);

    return {
      occupied: totalSeatsNeeded,
      available: table.capacity - totalSeatsNeeded,
      isOverCapacity: totalSeatsNeeded > table.capacity,
      guestCount: assignedGuests.length
    };
  };

  const getUnseatedGuests = (): Guest[] => {
    return guests.filter(guest => guest.rsvpStatus === 'accepted' && !guest.tableAssignment);
  };



  const handleItemSelect = (item: VenueElement | Table, type: 'element' | 'table') => {
    setSelectedItem({ type, item });
    if (type === 'element') {
      onElementSelect?.(item as VenueElement);
    } else {
      onTableSelect?.(item as Table);
    }
    if (type === 'table') {
      setPropertiesModalView('guests');
    } else {
      setPropertiesModalView('properties');
    }
    setShowProperties(true);
  };

  const moveItemToPosition = async (itemId: string, position: Position, type: 'element' | 'table') => {
    try {
      // Update local state immediately for responsive UI
      if (type === 'element') {
        setElements(prev => prev.map(el =>
          el.id === itemId ? { ...el, position } : el
        ));
      } else {
        setTables(prev => prev.map(t =>
          t.id === itemId ? { ...t, position } : t
        ));
      }

      // Update on server
      await updateItemPosition(itemId, position, type);

      Alert.alert('Success', `${type === 'element' ? 'Element' : 'Table'} moved successfully`);
    } catch (error) {
      console.error('Error moving item:', error);
      Alert.alert('Error', 'Failed to move item. Please try again.');

    }
  };



  // Debounced update function for better performance
  const updateItemPosition = useCallback(async (itemId: string, position: Position, type: 'element' | 'table') => {
    try {
      const endpoint = type === 'element'
        ? `${config.apiBaseUrl}/api/venue-layout/elements/${itemId}`
        : `${config.apiBaseUrl}/api/tables/${itemId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position })
      });

      if (!response.ok) {
        throw new Error('Failed to update position');
      }

      // Update layout change callback
      onLayoutChange?.({ elements, tables });
    } catch (error) {
      console.error('Error updating item position:', error);
      throw error;
    }
  }, [elements, tables, onLayoutChange]);



  const renderLibraryItem = ({ item }: { item: VenueElementLibraryItem }) => (
    <TouchableOpacity
      style={styles.libraryItem}
      onPress={() => createElementFromLibrary(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.libraryIcon}>{item.icon}</Text>
      <View style={styles.libraryItemText}>
        <Text style={styles.libraryName}>{item.name}</Text>
        <Text style={styles.libraryDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'layout' && styles.activeModeButton]}
          onPress={() => setMode('layout')}
        >
          <Text style={[styles.modeButtonText, mode === 'layout' && styles.activeModeButtonText]}>
            Layout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'tables' && styles.activeModeButton]}
          onPress={() => setMode('tables')}
        >
          <Text style={[styles.modeButtonText, mode === 'tables' && styles.activeModeButtonText]}>
            Tables
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'arrangement' && styles.activeModeButton]}
          onPress={() => setMode('arrangement')}
        >
          <Text style={[styles.modeButtonText, mode === 'arrangement' && styles.activeModeButtonText]}>
            Arrangement
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {mode === 'layout' && (
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowLibrary(true)}
            >
              <Text style={styles.toolbarButtonText}>📚 Library</Text>
            </TouchableOpacity>
          )}

          {mode === 'tables' && (
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowTableCreation(true)}
            >
              <Text style={styles.toolbarButtonText}>➕ Add Table</Text>
            </TouchableOpacity>
          )}

          {mode === 'arrangement' && (
            <>
              <TouchableOpacity
                style={[styles.toolbarButton, isArranging && styles.disabledButton]}
                onPress={() => setShowAutoArrangement(true)}
                disabled={isArranging}
              >
                <Text style={styles.toolbarButtonText}>
                  {isArranging ? '⏳ Arranging...' : '🎯 Auto Arrange'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={resetAllAssignments}
              >
                <Text style={styles.toolbarButtonText}>🔄 Reset All</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={zoomOut}
          >
            <Text style={styles.toolbarButtonText}>🔍-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={resetView}
          >
            <Text style={styles.toolbarButtonText}>🎯 Reset View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={zoomIn}
          >
            <Text style={styles.toolbarButtonText}>🔍+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={loadData}
          >
            <Text style={styles.toolbarButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.zoomIndicator}>
          {Math.round(gestureState.scale * 100)}%
        </Text>
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View style={styles.canvasWrapper}>
          <PinchGestureHandler
            ref={canvasPinchRef}
            onGestureEvent={e => {
              const newScale = gestureState.scale * e.nativeEvent.scale;
              if (newScale >= MIN_SCALE && newScale <= MAX_SCALE) {
                setGestureState(prev => ({ ...prev, scale: newScale }));
              }
            }}
            simultaneousHandlers={canvasPanRef}
          >
            <Animated.View>
              <PanGestureHandler
                ref={canvasPanRef}
                onHandlerStateChange={({ nativeEvent }) => {
                  if (nativeEvent.state === State.ACTIVE) {
                    setGestureState(prev => ({
                      ...prev,
                      translateX: nativeEvent.translationX,
                      translateY: nativeEvent.translationY
                    }));
                  }
                }}
                simultaneousHandlers={canvasPinchRef}
                minPointers={1}
                maxPointers={1}
              >
                <Animated.View
                  style={[
                    styles.canvas,
                    {
                      width: CANVAS_WIDTH,
                      height: CANVAS_HEIGHT,
                    },
                    canvasStyle,
                  ]}
                >
                  <PanGestureHandler
                    onGestureEvent={e => {
                      if (draggedItem) {
                        const { translationX, translationY } = e.nativeEvent;
                        const newX = draggedItem.startPos.x + translationX / gestureState.scale;
                        const newY = draggedItem.startPos.y + translationY / gestureState.scale;

                        if (draggedItem.type === 'element') {
                          setElements(prev =>
                            prev.map(el =>
                              el.id === draggedItem.item.id
                                ? { ...el, position: { x: newX, y: newY } }
                                : el
                            )
                          );
                        } else {
                          setTables(prev =>
                            prev.map(t =>
                              t.id === draggedItem.item.id
                                ? { ...t, position: { x: newX, y: newY } }
                                : t
                            )
                          );
                        }
                      }
                    }}
                    onHandlerStateChange={e => {
                      if (e.nativeEvent.state === State.END && draggedItem) {
                        const { translationX, translationY } = e.nativeEvent;
                        const finalPosition = {
                          x: draggedItem.startPos.x + translationX / gestureState.scale,
                          y: draggedItem.startPos.y + translationY / gestureState.scale,
                        };
                        updateItemPosition(draggedItem.item.id, finalPosition, draggedItem.type);
                        setDraggedItem(null);
                      }
                    }}
                  >
                    <Animated.View style={{ flex: 1 }}>
                  {/* Grid background */}
                  <View style={styles.grid} />

                  {/* Canvas center indicator */}
                  <View style={styles.canvasCenter}>
                    <Text style={styles.canvasCenterText}>Venue Canvas</Text>
                    <Text style={styles.canvasCenterSubtext}>
                      {mode === 'layout' ? 'Long press elements to drag' :
                        mode === 'tables' ? 'Long press tables to drag' :
                          'Long press items to move them'}
                    </Text>
                  </View>

                  {/* Canvas tap handler for adding tables */}
                  {mode === 'tables' && !gestureState.isGesturing && (
                    <TouchableOpacity
                      style={styles.canvasTouchable}
                      onPress={(event: GestureResponderEvent) => {
                        if (!gestureState.isGesturing) {
                          const { locationX, locationY } = event.nativeEvent;
                          const position = {
                            x: Math.max(50, Math.min(CANVAS_WIDTH - 50, locationX / gestureState.scale)),
                            y: Math.max(50, Math.min(CANVAS_HEIGHT - 50, locationY / gestureState.scale))
                          };
                          createTable(position);
                        }
                      }}
                      activeOpacity={1}
                    />
                  )}

                  {/* Venue elements */}
                  {elements.map(element => {
                    const isSelected = selectedItem?.type === 'element' && selectedItem.item.id === element.id;
                    const isDraggingThis = draggedItem?.item.id === element.id;
                    return (
                      <LongPressGestureHandler
                        key={`element-${element.id}-${Math.random()}`}
                        onHandlerStateChange={e => {
                          if (e.nativeEvent.state === State.ACTIVE) {
                            setDraggedItem({ type: 'element', item: element, startPos: element.position });
                          }
                        }}
                        minDurationMs={300}
                      >
                        <Animated.View
                          style={[
                            styles.venueElement,
                            {
                              position: 'absolute',
                              left: element.position.x,
                              top: element.position.y,
                              width: element.dimensions.width,
                              height: element.dimensions.height,
                              backgroundColor: element.color,
                              zIndex: isDraggingThis ? 1000 : 10,
                              opacity: isDraggingThis ? 0.8 : 1,
                              transform: [{ scale: isDraggingThis ? 1.1 : 1 }],
                            },
                            isSelected && styles.selectedElement,
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => !isDraggingThis && handleItemSelect(element, 'element')}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Text style={styles.elementLabel} numberOfLines={2}>
                              {element.name}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      </LongPressGestureHandler>
                    );
                  })}

                  {/* Tables */}
                  {tables.map(table => {
                    const isSelected = selectedItem?.type === 'table' && (selectedItem.item as Table).id === table.id;
                    const isDraggingThis = draggedItem?.item.id === table.id;
                    return (
                      <LongPressGestureHandler
                        key={`table-${table.id}-${Math.random()}`}
                        onHandlerStateChange={e => {
                          if (e.nativeEvent.state === State.ACTIVE && !table.isLocked) {
                            setDraggedItem({ type: 'table', item: table, startPos: table.position });
                          }
                        }}
                        minDurationMs={300}
                        enabled={!table.isLocked}
                      >
                        <Animated.View
                          style={[
                            styles.venueTable,
                            {
                              position: 'absolute',
                              left: table.position.x,
                              top: table.position.y,
                              zIndex: isDraggingThis ? 1000 : 10,
                              opacity: isDraggingThis ? 0.8 : 1,
                              transform: [{ scale: isDraggingThis ? 1.2 : 1 }],
                            },
                            isSelected && styles.selectedTable,
                            table.isLocked && styles.lockedTable,
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => !isDraggingThis && handleItemSelect(table, 'table')}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Text style={styles.tableLabel} numberOfLines={1}>
                              {table.name}
                            </Text>
                            <Text style={styles.tableCapacity}>
                              {table.capacity}{table.isLocked && ' 🔒'}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      </LongPressGestureHandler>
                    );
                  })}
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </PinchGestureHandler>
        </View>
      </View>

      {/* Element Library Modal */}
      <Modal
        visible={showLibrary}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Venue Element Library</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLibrary(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Tap any element to add it to your venue layout
          </Text>

          <FlatList
            data={library}
            renderItem={renderLibraryItem}
            keyExtractor={(item) => item.type}
            style={styles.libraryList}
            numColumns={2}
            columnWrapperStyle={styles.libraryRow}
          />
        </View>
      </Modal>

      {/* Properties Modal */}
      <Modal
        visible={showProperties && selectedItem !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedItem?.type === 'element' ? 'Element' : 'Table'} Properties
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProperties(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <View style={{ flex: 1 }}>
              {selectedItem.type === 'table' && (
                <View style={styles.modalViewToggle}>
                  <TouchableOpacity
                    style={[styles.toggleButton, propertiesModalView === 'guests' && styles.activeToggleButton]}
                    onPress={() => setPropertiesModalView('guests')}
                  >
                    <Text style={styles.toggleButtonText}>Guests</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, propertiesModalView === 'properties' && styles.activeToggleButton]}
                    onPress={() => setPropertiesModalView('properties')}
                  >
                    <Text style={styles.toggleButtonText}>Properties</Text>
                  </TouchableOpacity>
                </View>
              )}

              {propertiesModalView === 'guests' && selectedItem.type === 'table' ? (
                <FlatList
                  data={getGuestsForTable(selectedItem.item.id)}
                  keyExtractor={(guest) => guest.id}
                  renderItem={({ item: guest }) => (
                    <View style={styles.guestListItem}>
                      <Text style={styles.guestName}>{guest.name}</Text>
                      <Text style={styles.guestDetails}>
                        {guest.brideOrGroomSide} - {guest.relationshipType}
                      </Text>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyListText}>No guests assigned to this table.</Text>}
                />
              ) : (
                <ScrollView style={styles.propertiesContainer}>
                  <View style={styles.propertyGroup}>
                    <Text style={styles.propertyLabel}>Name:</Text>
                    <Text style={styles.propertyValue}>{selectedItem.item.name}</Text>
                  </View>

                  {selectedItem.type === 'element' && (
                    <>
                      <View style={styles.propertyGroup}>
                        <Text style={styles.propertyLabel}>Type:</Text>
                        <Text style={styles.propertyValue}>
                          {(selectedItem.item as VenueElement).type}
                        </Text>
                      </View>

                      <View style={styles.propertyGroup}>
                        <Text style={styles.propertyLabel}>Position:</Text>
                        <Text style={styles.propertyValue}>
                          X: {Math.round((selectedItem.item as VenueElement).position.x)},
                          Y: {Math.round((selectedItem.item as VenueElement).position.y)}
                        </Text>
                      </View>

                      <View style={styles.propertyGroup}>
                        <Text style={styles.propertyLabel}>Size:</Text>
                        <Text style={styles.propertyValue}>
                          {Math.round((selectedItem.item as VenueElement).dimensions.width)} ×
                          {Math.round((selectedItem.item as VenueElement).dimensions.height)}
                        </Text>
                      </View>
                    </>
                  )}

                  {selectedItem.type === 'table' && (
                    <>
                      <View style={styles.propertyGroup}>
                        <Text style={styles.propertyLabel}>Capacity:</Text>
                        <Text style={styles.propertyValue}>
                          {(selectedItem.item as Table).capacity} seats
                        </Text>
                      </View>

                      <View style={styles.propertyGroup}>
                        <Text style={styles.propertyLabel}>Position:</Text>
                        <Text style={styles.propertyValue}>
                          X: {Math.round((selectedItem.item as Table).position.x)},
                          Y: {Math.round((selectedItem.item as Table).position.y)}
                        </Text>
                      </View>

                      <View style={styles.propertyGroup}>
                        <Text style={styles.propertyLabel}>Status:</Text>
                        <Text style={styles.propertyValue}>
                          {(selectedItem.item as Table).isLocked ? 'Locked 🔒' : 'Unlocked 🔓'}
                        </Text>
                      </View>
                    </>
                  )}

                  <View style={styles.propertyActions}>
                    {selectedItem.type === 'element' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteElement(selectedItem.item.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete Element</Text>
                      </TouchableOpacity>
                    )}

                    {selectedItem.type === 'table' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.primaryButton]}
                          onPress={() => toggleTableLock(selectedItem.item.id)}
                        >
                          <Text style={styles.primaryButtonText}>
                            {(selectedItem.item as Table).isLocked ? 'Unlock Table' : 'Lock Table'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => deleteTable(selectedItem.item.id)}
                        >
                          <Text style={styles.deleteButtonText}>Delete Table</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Auto Arrangement Modal */}
      <Modal
        visible={showAutoArrangement}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Auto Table Arrangement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAutoArrangement(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.autoArrangementContent}>
            <Text style={styles.modalSubtitle}>
              Configure auto-arrangement options
            </Text>

            <View style={styles.optionGroup}>
              <View style={styles.optionItem}>
                <Text style={styles.optionLabel}>Respect Relationships</Text>
                <Switch
                  value={autoOptions.respectRelationships}
                  onValueChange={(value) => setAutoOptions(prev => ({
                    ...prev,
                    respectRelationships: value
                  }))}
                />
              </View>

              <View style={styles.optionItem}>
                <Text style={styles.optionLabel}>Keep Families Together</Text>
                <Switch
                  value={autoOptions.keepFamiliesTogether}
                  onValueChange={(value) => setAutoOptions(prev => ({
                    ...prev,
                    keepFamiliesTogether: value
                  }))}
                />
              </View>

              <View style={styles.optionItem}>
                <Text style={styles.optionLabel}>Consider Dietary Restrictions</Text>
                <Switch
                  value={autoOptions.considerDietaryRestrictions}
                  onValueChange={(value) => setAutoOptions(prev => ({
                    ...prev,
                    considerDietaryRestrictions: value
                  }))}
                />
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Guests</Text>
                <Text style={styles.statValue}>{guests.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Unseated</Text>
                <Text style={styles.statValue}>{getUnseatedGuests().length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Available Tables</Text>
                <Text style={styles.statValue}>{tables.filter(t => !t.isLocked).length}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isArranging && styles.disabledButton]}
              onPress={() => {
                setShowAutoArrangement(false);
                performAutoArrangement();
              }}
              disabled={isArranging}
            >
              <Text style={styles.primaryButtonText}>
                {isArranging ? 'Arranging...' : 'Start Auto Arrangement'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Table Creation Modal */}
      <Modal
        visible={showTableCreation}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Table</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTableCreation(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableCreationContent}>
            <Text style={styles.modalSubtitle}>
              Choose how to add a new table to your venue
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setShowTableCreation(false);
                // Create table at center of canvas
                const centerX = CANVAS_WIDTH / 2;
                const centerY = CANVAS_HEIGHT / 2;
                createTable({ x: centerX, y: centerY });
              }}
            >
              <Text style={styles.primaryButtonText}>Add Table at Center</Text>
            </TouchableOpacity>

            <Text style={styles.instructionText}>
              Or close this dialog and tap anywhere on the canvas to place a table there
            </Text>
          </View>
        </View>
      </Modal>

      {/* Guest Assignment Panel for Arrangement Mode */}
      {mode === 'arrangement' && (
        <View style={styles.guestPanel}>
          <Text style={styles.guestPanelTitle}>
            Unseated Guests ({getUnseatedGuests().length})
          </Text>
          <ScrollView style={styles.guestList} horizontal showsHorizontalScrollIndicator={false}>
            {getUnseatedGuests().map(guest => (
              <TouchableOpacity
                key={guest.id}
                style={styles.guestChip}
                onPress={() => {
                  Alert.alert(
                    'Assign Guest',
                    `Assign ${guest.name} to which table?`,
                    tables.filter(t => !t.isLocked).map(table => {
                      const capacityInfo = getTableCapacityInfo(table);
                      return {
                        text: `${table.name} (${capacityInfo.occupied}/${table.capacity})`,
                        onPress: () => assignGuestToTable(guest.id, table.id)
                      };
                    }).concat([{ text: 'Cancel', onPress: async () => { } }])
                  );
                }}
              >
                <Text style={styles.guestChipText}>{guest.name}</Text>
                <Text style={styles.guestChipDetails}>
                  {guest.brideOrGroomSide} • {guest.relationshipType}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Mode-specific Instructions */}
      {!gestureState.isGesturing && elements.length === 0 && tables.length === 0 && (
        <View style={styles.instructionsOverlay}>
          <Text style={styles.instructionsTitle}>
            {mode === 'layout' ? 'Layout Mode' : mode === 'tables' ? 'Tables Mode' : 'Arrangement Mode'}
          </Text>
          <Text style={styles.instructionsText}>
            {mode === 'layout' &&
              '• Tap "Library" to add venue elements like stage, dance floor, bar\n• Elements will appear on the white canvas below\n• Drag elements to rearrange them\n• Tap elements to select and edit properties'
            }
            {mode === 'tables' &&
              '• Tap "Add Table" or tap anywhere on the canvas to create tables\n• Tables appear as green circles\n• Drag tables to rearrange them\n• Tap tables to select and manage properties'
            }
            {mode === 'arrangement' &&
              '• Use "Auto Arrange" to automatically assign guests to tables\n• Scroll through unseated guests below\n• Tap guests to manually assign to tables'
            }
          </Text>
          <Text style={styles.instructionsSubtext}>
            Pinch to zoom • Drag to pan • Long press and drag to move items
          </Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeModeButton: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeModeButtonText: {
    color: 'white',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    minHeight: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    opacity: 0.6,
  },
  zoomIndicator: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: 60,
    textAlign: 'center',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  canvas: {
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#2196F3',
    borderRadius: 12,
    position: 'relative',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  canvasTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.02)',
    // Subtle grid pattern
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  canvasCenter: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 100,
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
    borderStyle: 'dashed',
  },
  canvasCenterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(33, 150, 243, 0.5)',
    marginBottom: 8,
  },
  canvasCenterSubtext: {
    fontSize: 12,
    color: 'rgba(102, 102, 102, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  venueElement: {
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  selectedElement: {
    borderColor: '#2196F3',
    borderWidth: 4,
    transform: [{ scale: 1.05 }],
  },
  draggingElement: {
    borderColor: '#FF9800',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
    ...Platform.select({
      ios: {
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  elementTouchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elementLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  venueTable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#388E3C',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  selectedTable: {
    borderColor: '#2196F3',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  draggingTable: {
    borderColor: '#FF9800',
    borderWidth: 4,
    transform: [{ scale: 1.2 }],
    ...Platform.select({
      ios: {
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  tableTouchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTable: {
    backgroundColor: '#757575',
    borderColor: '#424242',
  },
  overCapacityTable: {
    backgroundColor: '#F44336',
    borderColor: '#D32F2F',
  },
  tableLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tableCapacity: {
    fontSize: 9,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  libraryList: {
    flex: 1,
    padding: 16,
  },
  libraryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  libraryItem: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  libraryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  libraryItemText: {
    flex: 1,
  },
  libraryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  libraryDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  propertiesContainer: {
    flex: 1,
    padding: 16,
  },
  propertyGroup: {
    marginBottom: 16,
  },
  propertyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    color: '#666',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  propertyActions: {
    marginTop: 24,
  },
  actionButton: {
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  instructionsOverlay: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dragIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 2000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dragIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  dragIndicatorSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  guestIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 15,
  },
  guestIndicatorText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  autoArrangementContent: {
    flex: 1,
    padding: 16,
  },
  optionGroup: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tableCreationContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  guestPanel: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxHeight: 120,
  },
  guestPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  guestList: {
    flex: 1,
  },
  guestChip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  guestChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976d2',
  },
  guestChipDetails: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  dragModeOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dragModeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  dragModeText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  cancelDragButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelDragText: {
    color: 'white',
    fontWeight: '500',
  },
  modalViewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeToggleButton: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  guestListItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestDetails: {
    fontSize: 14,
    color: '#666',
  },
  emptyListText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default MobileVenueLayoutManager;