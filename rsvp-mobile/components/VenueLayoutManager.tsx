import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { VenueElement, Position, Dimensions as VenueDimensions } from '../types';

interface VenueElementLibraryItem {
  type: VenueElement['type'];
  name: string;
  defaultDimensions: VenueDimensions;
  defaultColor: string;
  description: string;
  icon?: string;
}

interface VenueLayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface VenueLayoutManagerProps {
  eventId: string;
  onElementSelect?: (element: VenueElement | null) => void;
  onLayoutChange?: (elements: VenueElement[]) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VenueLayoutManager: React.FC<VenueLayoutManagerProps> = ({
  eventId,
  onElementSelect,
  onLayoutChange
}) => {
  const [elements, setElements] = useState<VenueElement[]>([]);
  const [library, setLibrary] = useState<VenueElementLibraryItem[]>([]);
  const [selectedElement, setSelectedElement] = useState<VenueElement | null>(null);
  const [bounds, setBounds] = useState<VenueLayoutBounds>({
    minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600
  });
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [scale, setScale] = useState(0.8);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [validation, setValidation] = useState<any>(null);

  // Load venue layout and library
  useEffect(() => {
    loadVenueLayout();
    loadElementLibrary();
  }, [eventId]);

  const loadVenueLayout = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setElements(data.elements);
        setBounds(data.bounds);
        onLayoutChange?.(data.elements);
      }
    } catch (error) {
      console.error('Error loading venue layout:', error);
    }
  };

  const loadElementLibrary = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/library');
      if (response.ok) {
        const data = await response.json();
        setLibrary(data);
      }
    } catch (error) {
      console.error('Error loading element library:', error);
    }
  };

  const validateLayout = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/events/${eventId}/validate`);
      if (response.ok) {
        const data = await response.json();
        setValidation(data);
        
        if (data.isValid) {
          Alert.alert('Validation', 'Layout is valid!');
        } else {
          const issues = [...data.errors, ...data.warnings].join('\n');
          Alert.alert('Validation Issues', issues);
        }
      }
    } catch (error) {
      console.error('Error validating layout:', error);
    }
  };

  const createElementFromLibrary = async (libraryItem: VenueElementLibraryItem, position: Position) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/events/${eventId}/elements/from-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: libraryItem.type,
          position,
          name: libraryItem.name
        })
      });

      if (response.ok) {
        const newElement = await response.json();
        setElements(prev => [...prev, newElement]);
        onLayoutChange?.([...elements, newElement]);
        setShowLibrary(false);
        return newElement;
      }
    } catch (error) {
      console.error('Error creating element:', error);
    }
  };

  const updateElement = async (elementId: string, updates: Partial<VenueElement>) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/elements/${elementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedElement = await response.json();
        setElements(prev => prev.map(el => el.id === elementId ? updatedElement : el));
        onLayoutChange?.(elements.map(el => el.id === elementId ? updatedElement : el));
        return updatedElement;
      }
    } catch (error) {
      console.error('Error updating element:', error);
    }
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
                const newElements = elements.filter(el => el.id !== elementId);
                setElements(newElements);
                onLayoutChange?.(newElements);
                if (selectedElement?.id === elementId) {
                  setSelectedElement(null);
                  onElementSelect?.(null);
                  setShowProperties(false);
                }
              }
            } catch (error) {
              console.error('Error deleting element:', error);
            }
          }
        }
      ]
    );
  };

  const duplicateElement = async (elementId: string) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/venue-layout/elements/${elementId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: { x: 20, y: 20 } })
      });

      if (response.ok) {
        const duplicatedElement = await response.json();
        setElements(prev => [...prev, duplicatedElement]);
        onLayoutChange?.([...elements, duplicatedElement]);
      }
    } catch (error) {
      console.error('Error duplicating element:', error);
    }
  };

  const handleElementPress = (element: VenueElement) => {
    setSelectedElement(element);
    onElementSelect?.(element);
    setShowProperties(true);
  };

  const handleLibraryItemPress = (libraryItem: VenueElementLibraryItem) => {
    // Place element at center of visible area
    const centerPosition = {
      x: Math.max(0, (screenWidth / scale - libraryItem.defaultDimensions.width) / 2 - panOffset.x),
      y: Math.max(0, (screenHeight / scale - libraryItem.defaultDimensions.height) / 2 - panOffset.y)
    };
    
    createElementFromLibrary(libraryItem, centerPosition);
  };

  const handlePinchGesture = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const newScale = Math.max(0.25, Math.min(2, event.nativeEvent.scale * scale));
      setScale(newScale);
    }
  };

  const handlePanGesture = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      setPanOffset({
        x: panOffset.x + event.nativeEvent.translationX / scale,
        y: panOffset.y + event.nativeEvent.translationY / scale
      });
    }
  };

  const renderElement = (element: VenueElement) => (
    <TouchableOpacity
      key={element.id}
      style={[
        styles.venueElement,
        {
          left: element.position.x,
          top: element.position.y,
          width: element.dimensions.width,
          height: element.dimensions.height,
          backgroundColor: element.color,
          borderColor: selectedElement?.id === element.id ? '#007acc' : 'transparent',
          borderWidth: selectedElement?.id === element.id ? 2 : 0
        }
      ]}
      onPress={() => handleElementPress(element)}
    >
      <Text style={styles.elementLabel} numberOfLines={2}>
        {element.name}
      </Text>
    </TouchableOpacity>
  );

  const renderLibraryItem = ({ item }: { item: VenueElementLibraryItem }) => (
    <TouchableOpacity
      style={styles.libraryItem}
      onPress={() => handleLibraryItemPress(item)}
    >
      <Text style={styles.libraryIcon}>{item.icon}</Text>
      <View style={styles.libraryItemText}>
        <Text style={styles.libraryName}>{item.name}</Text>
        <Text style={styles.libraryDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowLibrary(true)}
        >
          <Text style={styles.toolbarButtonText}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={validateLayout}
        >
          <Text style={styles.toolbarButtonText}>Validate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={loadVenueLayout}
        >
          <Text style={styles.toolbarButtonText}>Refresh</Text>
        </TouchableOpacity>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => setScale(Math.max(0.25, scale - 0.25))}
          >
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => setScale(Math.min(2, scale + 0.25))}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas */}
      <PinchGestureHandler onGestureEvent={handlePinchGesture}>
        <PanGestureHandler onGestureEvent={handlePanGesture}>
          <View style={styles.canvasContainer}>
            <View
              style={[
                styles.canvas,
                {
                  transform: [
                    { scale },
                    { translateX: panOffset.x },
                    { translateY: panOffset.y }
                  ],
                  width: Math.max(screenWidth, bounds.width + 100),
                  height: Math.max(screenHeight, bounds.height + 100)
                }
              ]}
            >
              {elements.map(renderElement)}
            </View>
          </View>
        </PanGestureHandler>
      </PinchGestureHandler>

      {/* Element Library Modal */}
      <Modal
        visible={showLibrary}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Element Library</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLibrary(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={library}
            renderItem={renderLibraryItem}
            keyExtractor={(item) => item.type}
            style={styles.libraryList}
          />
        </View>
      </Modal>

      {/* Element Properties Modal */}
      <Modal
        visible={showProperties && selectedElement !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Element Properties</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProperties(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {selectedElement && (
            <ScrollView style={styles.propertiesContainer}>
              <View style={styles.propertyGroup}>
                <Text style={styles.propertyLabel}>Name:</Text>
                <TextInput
                  style={styles.propertyInput}
                  value={selectedElement.name}
                  onChangeText={(text) => {
                    const updated = { ...selectedElement, name: text };
                    setSelectedElement(updated);
                    updateElement(selectedElement.id, { name: text });
                  }}
                />
              </View>

              <View style={styles.propertyGroup}>
                <Text style={styles.propertyLabel}>Type:</Text>
                <Text style={styles.propertyValue}>{selectedElement.type}</Text>
              </View>

              <View style={styles.propertyGroup}>
                <Text style={styles.propertyLabel}>Position:</Text>
                <Text style={styles.propertyValue}>
                  X: {Math.round(selectedElement.position.x)}, Y: {Math.round(selectedElement.position.y)}
                </Text>
              </View>

              <View style={styles.propertyGroup}>
                <Text style={styles.propertyLabel}>Size:</Text>
                <Text style={styles.propertyValue}>
                  {Math.round(selectedElement.dimensions.width)} × {Math.round(selectedElement.dimensions.height)}
                </Text>
              </View>

              <View style={styles.propertyActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => duplicateElement(selectedElement.id)}
                >
                  <Text style={styles.actionButtonText}>Duplicate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteElement(selectedElement.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  toolbarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: 'white'
  },
  toolbarButtonText: {
    fontSize: 14,
    color: '#333'
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto'
  },
  zoomButton: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  zoomButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  zoomText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#333'
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  canvas: {
    backgroundColor: 'white',
    margin: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  venueElement: {
    position: 'absolute',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  elementLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007acc',
    borderRadius: 4
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '500'
  },
  libraryList: {
    flex: 1,
    padding: 16
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#fafafa'
  },
  libraryIcon: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
    marginRight: 12
  },
  libraryItemText: {
    flex: 1
  },
  libraryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  libraryDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  propertiesContainer: {
    flex: 1,
    padding: 16
  },
  propertyGroup: {
    marginBottom: 16
  },
  propertyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  propertyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: 'white'
  },
  propertyValue: {
    fontSize: 14,
    color: '#666',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4
  },
  propertyActions: {
    marginTop: 20
  },
  actionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'white'
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    borderColor: '#cc0000'
  },
  deleteButtonText: {
    color: 'white'
  }
});

export default VenueLayoutManager;