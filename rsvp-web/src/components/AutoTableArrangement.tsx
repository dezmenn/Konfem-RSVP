import React, { useState, useEffect, useCallback } from 'react';
import { Table, Guest, Position } from '../../../shared/src/types';
import './AutoTableArrangement.css';

interface AutoTableArrangementProps {
  eventId: string;
  tables: Table[];
  onTablesChange: (tables: Table[]) => void;
}

interface GuestWithTable extends Guest {
  tableId?: string;
}

interface DragState {
  isDragging: boolean;
  draggedGuest: GuestWithTable | null;
  dragOffset: Position;
  draggedFromTable?: string;
  dragOverTable?: string;
  dragValidation?: {
    isValid: boolean;
    reason?: string;
  };
}

interface AssignmentHistoryEntry {
  id: string;
  timestamp: Date;
  description: string;
  action: 'assign' | 'unassign' | 'bulk_assign' | 'bulk_unassign' | 'auto_arrange';
  guestIds: string[];
  tableIds: string[];
  previousState?: Map<string, string | undefined>; // guestId -> tableId
}

interface BulkSelectionState {
  isActive: boolean;
  selectedGuestIds: Set<string>;
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
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedGuest: null,
    dragOffset: { x: 0, y: 0 }
  });
  const [autoOptions, setAutoOptions] = useState<AutoArrangementOptions>({
    respectRelationships: true,
    considerDietaryRestrictions: false,
    keepFamiliesTogether: true
  });
  const [isArranging, setIsArranging] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<BulkSelectionState>({
    isActive: false,
    selectedGuestIds: new Set()
  });
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  // Removed unused canvasRef

  // Load guests and categorize them
  useEffect(() => {
    loadGuests();
  }, [eventId]);

  useEffect(() => {
    categorizeGuests();
  }, [guests, tables]);

  // Auto-refresh data when component becomes active (tables prop gets populated)
  useEffect(() => {
    if (tables.length > 0) {
      // When tables are loaded (tab becomes active), refresh guests to ensure sync
      loadGuests();
    }
  }, [tables.length]); // Trigger when tables array length changes

  const loadGuests = async () => {
    try {
      const response = await fetch(`/api/guests/${eventId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGuests(result.data);
        } else {
          console.error('Failed to load guests:', result.error);
        }
      }
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch(`/api/tables/events/${eventId}`);
      if (response.ok) {
        const tableData = await response.json();
        onTablesChange(tableData); // Update parent component with fresh table data
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const categorizeGuests = () => {
    const seated: GuestWithTable[] = [];
    const unseated: GuestWithTable[] = [];
    const processedGuestIds = new Set<string>();

    // Only process guests with accepted RSVP status for auto-arrangement
    const eligibleGuests = guests.filter(guest => guest.rsvpStatus === 'accepted');

    eligibleGuests.forEach(guest => {
      // Skip if we've already processed this guest (prevent duplicates)
      if (processedGuestIds.has(guest.id)) {
        return;
      }
      processedGuestIds.add(guest.id);

      // Use ONLY the table's assignedGuests array as the single source of truth
      // This ensures consistency across tab switches
      let assignedTableId: string | undefined;
      
      const assignedTable = tables.find(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      if (assignedTable) {
        assignedTableId = assignedTable.id;
      }
      // Note: Removed fallback to guest.tableAssignment to ensure single source of truth

      if (assignedTableId) {
        seated.push({ ...guest, tableId: assignedTableId });
      } else {
        unseated.push(guest);
      }
    });

    setSeatedGuests(seated);
    setUnseatedGuests(unseated);
  };

  const getGuestsByTable = (tableId: string): GuestWithTable[] => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return [];

    // Use a Set to prevent duplicates and prioritize table's assignedGuests array
    const assignedGuestIds = new Set<string>();
    
    // First, add guests from the table's assignedGuests array (primary source)
    if (table.assignedGuests) {
      table.assignedGuests.forEach(guestId => assignedGuestIds.add(guestId));
    }
    
    // Then, add guests who have this table as their tableAssignment (fallback)
    guests.forEach(guest => {
      if (guest.tableAssignment === tableId) {
        assignedGuestIds.add(guest.id);
      }
    });

    // Filter guests based on the unique set of IDs - SHOW ALL assigned guests regardless of RSVP status
    const tableGuests = guests.filter(guest => 
      assignedGuestIds.has(guest.id)
    );
    
    return tableGuests.map(guest => ({ ...guest, tableId }));
  };

  const getTableCapacityInfo = (table: Table) => {
    // Get ALL assigned guests for capacity calculation (not just accepted ones)
    const allAssignedGuestIds = new Set<string>();
    
    // Add guests from table's assignedGuests array
    if (table.assignedGuests) {
      table.assignedGuests.forEach(guestId => allAssignedGuestIds.add(guestId));
    }
    
    // Add guests who have this table as their tableAssignment
    guests.forEach(guest => {
      if (guest.tableAssignment === table.id) {
        allAssignedGuestIds.add(guest.id);
      }
    });

    // Calculate total seats needed including additional guests (ALL guests, not just accepted)
    let totalSeatsNeeded = 0;
    let acceptedGuestCount = 0;
    
    allAssignedGuestIds.forEach(guestId => {
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        totalSeatsNeeded += 1 + (guest.additionalGuestCount || 0);
        if (guest.rsvpStatus === 'accepted') {
          acceptedGuestCount++;
        }
      }
    });
    
    return {
      occupied: totalSeatsNeeded,
      available: table.capacity - totalSeatsNeeded,
      isOverCapacity: totalSeatsNeeded > table.capacity,
      guestCount: acceptedGuestCount, // Show only accepted guests count for display
      totalGuestCount: allAssignedGuestIds.size // Total assigned guests regardless of RSVP status
    };
  };

  // Auto-arrangement algorithm
  const performAutoArrangement = async () => {
    setIsArranging(true);
    
    try {
      // Capture current state before auto-arrangement for undo functionality
      const previousState = new Map<string, string | undefined>();
      const allCurrentGuests = await fetch(`/api/guests/${eventId}`);
      if (allCurrentGuests.ok) {
        const guestsData = await allCurrentGuests.json();
        if (guestsData.success) {
          console.log('Capturing previous state for', guestsData.data.length, 'guests');
          guestsData.data.forEach((guest: any) => {
            // Normalize null to undefined for consistency
            const tableAssignment = guest.tableAssignment || undefined;
            previousState.set(guest.id, tableAssignment);
            console.log(`  - ${guest.name} (${guest.id}): ${tableAssignment || 'unassigned'}`);
          });
        }
      }

      const response = await fetch(`/api/tables/events/${eventId}/auto-arrange-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constraints: autoOptions })
      });

      const result = await response.json();
      
      if (result.success) {
        // Add to assignment history
        addToHistory({
          description: `Auto-arranged ${result.arrangedGuests || 'guests'} using algorithm`,
          action: 'auto_arrange',
          guestIds: [], // We don't have specific guest IDs from the auto-arrange result
          tableIds: [], // We don't have specific table IDs from the auto-arrange result
          previousState
        });

        alert(`${result.message}`);
        
        // Comprehensive data refresh to ensure consistency across all components
        await Promise.all([
          loadGuests(),
          loadTables()
        ]);
        
        // React's useEffect will automatically call categorizeGuests() when guests/tables state changes
        
      } else {
        alert(`Auto-arrangement failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error during auto-arrangement:', error);
      alert('Auto-arrangement failed. Please try again.');
    } finally {
      setIsArranging(false);
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign guest to table');
      }
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      throw error;
    }
  };

  // Table lock/unlock functions
  const toggleTableLock = async (tableId: string) => {
    try {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      const endpoint = table.isLocked ? 'unlock' : 'lock';
      const response = await fetch(`/api/tables/${tableId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Refresh tables data
        await loadTables();
        
        // Show feedback to user
        const action = table.isLocked ? 'unlocked' : 'locked';
        console.log(`Table "${table.name}" has been ${action}`);
      } else {
        throw new Error('Failed to toggle table lock');
      }
    } catch (error) {
      console.error('Error toggling table lock:', error);
      alert('Failed to toggle table lock');
    }
  };

  const unassignGuestFromTable = async (guestId: string) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/unassign-table`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign guest from table');
      }
    } catch (error) {
      console.error('Error unassigning guest from table:', error);
      throw error;
    }
  };

  // Assignment history functions
  const addToHistory = (entry: Omit<AssignmentHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: AssignmentHistoryEntry = {
      ...entry,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setAssignmentHistory(prev => {
      const newHistory = [...prev.slice(0, currentHistoryIndex + 1), newEntry];
      return newHistory.slice(-20); // Keep only last 20 entries
    });
    setCurrentHistoryIndex(prev => Math.min(prev + 1, 19));
  };

  const undoLastAssignment = async () => {
    if (currentHistoryIndex < 0 || !assignmentHistory[currentHistoryIndex]) {
      console.log('No assignment to undo');
      return;
    }
    
    const entry = assignmentHistory[currentHistoryIndex];
    if (!entry.previousState) {
      console.log('No previous state to restore');
      return;
    }

    console.log('Starting undo operation for:', entry.description);
    console.log('Previous state:', entry.previousState);

    try {
      // First, get current guests to validate which ones still exist
      const currentGuestsResponse = await fetch(`/api/guests/${eventId}`);
      let validGuestIds = new Set<string>();
      
      if (currentGuestsResponse.ok) {
        const currentGuestsData = await currentGuestsResponse.json();
        if (currentGuestsData.success) {
          validGuestIds = new Set(currentGuestsData.data.map((g: any) => g.id));
        }
      }

      // Restore previous state - only for guests that still exist
      const assignments = Array.from(entry.previousState.entries());
      const validAssignments = assignments.filter(([guestId]) => validGuestIds.has(guestId));
      
      console.log(`Processing ${validAssignments.length} valid guest assignments (${assignments.length - validAssignments.length} guests no longer exist)`);
      
      for (const [guestId, previousTableId] of validAssignments) {
        console.log(`Restoring guest ${guestId} to table ${previousTableId || 'unassigned'}`);
        
        try {
          if (previousTableId) {
            await assignGuestToTable(guestId, previousTableId);
            console.log(`✅ Successfully assigned guest ${guestId} to table ${previousTableId}`);
          } else {
            await unassignGuestFromTable(guestId);
            console.log(`✅ Successfully unassigned guest ${guestId}`);
          }
        } catch (guestError) {
          console.error(`❌ Failed to restore guest ${guestId}:`, guestError);
          // Don't throw error for individual guest failures - continue with others
          const errorMessage = guestError instanceof Error ? guestError.message : 'Unknown error';
          console.log(`⚠️ Skipping guest ${guestId} due to error: ${errorMessage}`);
        }
      }

      // Refresh data
      console.log('Refreshing data after undo...');
      await Promise.all([loadGuests(), loadTables()]);
      
      // Move history index back
      setCurrentHistoryIndex(prev => prev - 1);
      console.log('✅ Undo operation completed successfully');
      
    } catch (error) {
      console.error('❌ Error during undo operation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to undo assignment: ${errorMessage}`);
    }
  };

  const redoAssignment = async () => {
    if (currentHistoryIndex >= assignmentHistory.length - 1) return;
    
    const nextEntry = assignmentHistory[currentHistoryIndex + 1];
    if (!nextEntry) return;

    try {
      // Re-apply the assignment
      if (nextEntry.action === 'assign' && nextEntry.guestIds.length === 1 && nextEntry.tableIds.length === 1) {
        await assignGuestToTable(nextEntry.guestIds[0], nextEntry.tableIds[0]);
      } else if (nextEntry.action === 'unassign') {
        for (const guestId of nextEntry.guestIds) {
          await unassignGuestFromTable(guestId);
        }
      }

      // Refresh data
      await Promise.all([loadGuests(), loadTables()]);
      
      // Move history index forward
      setCurrentHistoryIndex(prev => prev + 1);
      
    } catch (error) {
      console.error('Error redoing assignment:', error);
      alert('Failed to redo assignment');
    }
  };

  const resetAllAssignments = async () => {
    // Confirm with user before resetting all assignments
    if (!window.confirm('Are you sure you want to unassign all guests from their tables? Guests in locked tables will not be affected. This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Starting reset all assignments...');
      
      // Get all currently assigned guests, excluding those in locked tables
      const assignedGuests = guests.filter(guest => {
        // Check if guest is assigned to any table
        const isInTableAssignedGuests = tables.some(table => 
          table.assignedGuests && table.assignedGuests.includes(guest.id)
        );
        const hasTableAssignment = guest.tableAssignment;
        
        if (!isInTableAssignedGuests && !hasTableAssignment) {
          return false; // Guest is not assigned to any table
        }

        // Check if the guest is in a locked table
        const assignedTable = tables.find(table => 
          (table.assignedGuests && table.assignedGuests.includes(guest.id)) ||
          table.id === guest.tableAssignment
        );

        if (assignedTable && assignedTable.isLocked) {
          console.log(`Skipping guest ${guest.name} - assigned to locked table "${assignedTable.name}"`);
          return false; // Skip guests in locked tables
        }

        return true; // Include this guest for reset
      });

      if (assignedGuests.length === 0) {
        alert('No guests are currently assigned to tables.');
        return;
      }

      console.log(`Found ${assignedGuests.length} assigned guests to unassign`);

      // Store previous state for undo functionality
      const previousState = new Map<string, string | undefined>();
      assignedGuests.forEach(guest => {
        // Find which table this guest is assigned to
        const assignedTable = tables.find(table => 
          table.assignedGuests && table.assignedGuests.includes(guest.id)
        );
        const tableId = assignedTable?.id || guest.tableAssignment || undefined;
        previousState.set(guest.id, tableId);
      });

      // Use bulk unassignment endpoint for efficiency
      const response = await fetch('/api/guests/bulk-unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestIds: assignedGuests.map(g => g.id)
        })
      });

      const result = await response.json();

      if (result.success) {
        // Add to assignment history
        addToHistory({
          description: `Reset all assignments - unassigned ${result.data.successfulUnassignments} guests`,
          action: 'bulk_unassign',
          guestIds: assignedGuests.map(g => g.id),
          tableIds: [],
          previousState
        });

        // Show success message
        alert(`Successfully unassigned ${result.data.successfulUnassignments} guests from their tables.`);
        
        if (result.data.failedUnassignments > 0) {
          console.warn(`${result.data.failedUnassignments} unassignments failed`);
        }
      } else {
        throw new Error(result.error || 'Reset all assignments failed');
      }

      // Comprehensive data refresh
      await Promise.all([loadGuests(), loadTables()]);
      
      console.log('✅ Reset all assignments completed successfully');
      
    } catch (error) {
      console.error('❌ Error resetting all assignments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to reset all assignments: ${errorMessage}`);
    }
  };

  // Bulk selection functions
  const toggleBulkSelection = () => {
    setBulkSelection(prev => ({
      isActive: !prev.isActive,
      selectedGuestIds: new Set()
    }));
  };

  const toggleGuestSelection = (guestId: string) => {
    setBulkSelection(prev => {
      const newSelected = new Set(prev.selectedGuestIds);
      if (newSelected.has(guestId)) {
        newSelected.delete(guestId);
      } else {
        newSelected.add(guestId);
      }
      return {
        ...prev,
        selectedGuestIds: newSelected
      };
    });
  };

  const selectAllUnseatedGuests = () => {
    setBulkSelection(prev => ({
      ...prev,
      selectedGuestIds: new Set(unseatedGuests.map(g => g.id))
    }));
  };

  const clearSelection = () => {
    setBulkSelection(prev => ({
      ...prev,
      selectedGuestIds: new Set()
    }));
  };

  const bulkAssignToTable = async (tableId: string) => {
    if (bulkSelection.selectedGuestIds.size === 0) return;

    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const selectedGuests = unseatedGuests.filter(g => bulkSelection.selectedGuestIds.has(g.id));
    const totalSeatsNeeded = selectedGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
    const capacityInfo = getTableCapacityInfo(table);

    if (capacityInfo.available < totalSeatsNeeded) {
      alert(`Table "${table.name}" doesn't have enough capacity. Needs ${totalSeatsNeeded} seats, but only ${capacityInfo.available} available.`);
      return;
    }

    if (table.isLocked) {
      alert(`Table "${table.name}" is locked and cannot accept new guests.`);
      return;
    }

    try {
      // Store previous state for undo
      const previousState = new Map<string, string | undefined>();
      selectedGuests.forEach(guest => {
        previousState.set(guest.id, guest.tableId);
      });

      // Use bulk assignment endpoint
      const response = await fetch('/api/guests/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestIds: Array.from(bulkSelection.selectedGuestIds),
          tableId: tableId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Add to history
        addToHistory({
          description: `Bulk assigned ${result.data.successfulAssignments} guests to ${table.name}`,
          action: 'bulk_assign',
          guestIds: Array.from(bulkSelection.selectedGuestIds),
          tableIds: [tableId],
          previousState
        });

        // Show success message
        if (result.data.failedAssignments > 0) {
          alert(`Assigned ${result.data.successfulAssignments} guests successfully. ${result.data.failedAssignments} assignments failed.`);
        }
      } else {
        alert(`Bulk assignment failed: ${result.error || 'Unknown error'}`);
        return;
      }

      // Refresh data and clear selection
      await Promise.all([loadGuests(), loadTables()]);
      clearSelection();

    } catch (error) {
      console.error('Error bulk assigning guests:', error);
      alert('Failed to bulk assign guests');
    }
  };

  const bulkUnassignGuests = async () => {
    if (bulkSelection.selectedGuestIds.size === 0) return;

    const selectedGuests = [...seatedGuests, ...unseatedGuests].filter(g => bulkSelection.selectedGuestIds.has(g.id));

    try {
      // Store previous state for undo
      const previousState = new Map<string, string | undefined>();
      selectedGuests.forEach(guest => {
        previousState.set(guest.id, guest.tableId);
      });

      // Use bulk unassignment endpoint
      const response = await fetch('/api/guests/bulk-unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestIds: Array.from(bulkSelection.selectedGuestIds)
        })
      });

      const result = await response.json();

      if (result.success) {
        // Add to history
        addToHistory({
          description: `Bulk unassigned ${result.data.successfulUnassignments} guests`,
          action: 'bulk_unassign',
          guestIds: Array.from(bulkSelection.selectedGuestIds),
          tableIds: [],
          previousState
        });

        // Show success message
        if (result.data.failedUnassignments > 0) {
          alert(`Unassigned ${result.data.successfulUnassignments} guests successfully. ${result.data.failedUnassignments} unassignments failed.`);
        }
      } else {
        alert(`Bulk unassignment failed: ${result.error || 'Unknown error'}`);
        return;
      }

      // Refresh data and clear selection
      await Promise.all([loadGuests(), loadTables()]);
      clearSelection();

    } catch (error) {
      console.error('Error bulk unassigning guests:', error);
      alert('Failed to bulk unassign guests');
    }
  };

  // Enhanced drag and drop handlers with visual feedback
  const handleGuestDragStart = useCallback((e: React.DragEvent, guest: GuestWithTable) => {
    e.dataTransfer.setData('application/json', JSON.stringify(guest));
    e.dataTransfer.effectAllowed = 'move';
    
    setDragState({
      isDragging: true,
      draggedGuest: guest,
      dragOffset: { x: 0, y: 0 },
      draggedFromTable: guest.tableId
    });

    // Add dragging class to the element
    e.currentTarget.classList.add('dragging');
  }, []);

  const handleGuestDragEnd = useCallback((e: React.DragEvent) => {
    setDragState({
      isDragging: false,
      draggedGuest: null,
      dragOffset: { x: 0, y: 0 }
    });

    // Remove dragging class
    e.currentTarget.classList.remove('dragging');
  }, []);

  const validateTableDrop = useCallback((guest: GuestWithTable, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return { isValid: false, reason: 'Table not found' };

    if (table.isLocked && guest.tableId !== tableId) {
      return { isValid: false, reason: 'Table is locked' };
    }

    const capacityInfo = getTableCapacityInfo(table);
    const guestSeatsNeeded = 1 + guest.additionalGuestCount;

    if (capacityInfo.available < guestSeatsNeeded && guest.tableId !== tableId) {
      return { isValid: false, reason: `Insufficient capacity (needs ${guestSeatsNeeded}, available ${capacityInfo.available})` };
    }

    return { isValid: true };
  }, [tables, getTableCapacityInfo]);

  const handleTableDragOver = useCallback((e: React.DragEvent, tableId?: string) => {
    e.preventDefault();
    
    if (tableId && dragState.draggedGuest) {
      const validation = validateTableDrop(dragState.draggedGuest, tableId);
      e.dataTransfer.dropEffect = validation.isValid ? 'move' : 'none';
      
      // Update drag state with validation
      setDragState(prev => ({
        ...prev,
        dragOverTable: tableId,
        dragValidation: validation
      }));
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
  }, [dragState.draggedGuest, validateTableDrop]);

  const handleTableDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dragOverTable: undefined,
      dragValidation: undefined
    }));
  }, []);

  const handleTableDrop = useCallback(async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    
    try {
      const guestData = JSON.parse(e.dataTransfer.getData('application/json'));
      const guest = guestData as GuestWithTable;
      
      // Check if table is locked
      const table = tables.find(t => t.id === tableId);
      if (!table) return;
      
      if (table.isLocked && guest.tableId !== tableId) {
        alert(`Table "${table.name}" is locked and cannot accept new guests. Unlock the table first to make changes.`);
        return;
      }
      
      const capacityInfo = getTableCapacityInfo(table);
      const guestSeatsNeeded = 1 + guest.additionalGuestCount;
      
      if (capacityInfo.available < guestSeatsNeeded && guest.tableId !== tableId) {
        alert(`Table "${table.name}" doesn't have enough capacity. Needs ${guestSeatsNeeded} seats, but only ${capacityInfo.available} available.`);
        return;
      }

      // Store previous state for undo functionality
      const previousState = new Map<string, string | undefined>();
      previousState.set(guest.id, guest.tableId);

      // If guest is moving from another table, unassign first
      if (guest.tableId && guest.tableId !== tableId) {
        await unassignGuestFromTable(guest.id);
      }

      // Assign to new table
      if (guest.tableId !== tableId) {
        await assignGuestToTable(guest.id, tableId);
        
        // Add to assignment history
        const fromTable = guest.tableId ? tables.find(t => t.id === guest.tableId)?.name : 'Unassigned';
        addToHistory({
          description: `Moved ${guest.name} from ${fromTable} to ${table.name}`,
          action: 'assign',
          guestIds: [guest.id],
          tableIds: [tableId],
          previousState
        });
        
        // Immediate data refresh to ensure UI updates
        await loadGuests(); // Load fresh guest data first
        await loadTables(); // Load fresh table data and update parent
        
        // React's useEffect will automatically call categorizeGuests() when guests/tables state changes
      }
    } catch (error) {
      console.error('Error handling table drop:', error);
      alert('Failed to assign guest to table');
    }
  }, [tables, loadGuests, loadTables, onTablesChange, addToHistory]);

  const handleUnseatedDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const guestData = JSON.parse(e.dataTransfer.getData('application/json'));
      const guest = guestData as GuestWithTable;
      
      if (guest.tableId) {
        await unassignGuestFromTable(guest.id);
        
        // Refresh data and ensure proper synchronization
        await loadGuests();
        await loadTables(); // This calls onTablesChange internally with fresh data
        
        // React's useEffect will automatically call categorizeGuests() when guests/tables state changes
      }
    } catch (error) {
      console.error('Error handling unseated drop:', error);
      alert('Failed to unassign guest from table');
    }
  }, [loadGuests, loadTables]);

  return (
    <div className="auto-table-arrangement">
      {/* Four-column header layout */}
      <div className="arrangement-header-grid">
        {/* Column 1: Statistics */}
        <div className="arrangement-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Guests:</span>
              <span className="stat-value">{guests.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Seated:</span>
              <span className="stat-value seated">{seatedGuests.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Unseated:</span>
              <span className="stat-value unseated">{unseatedGuests.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tables:</span>
              <span className="stat-value">{tables.length}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Table Layout Controls */}
        <div className="arrangement-header">
          <h2>Table Layout</h2>
          <div className="arrangement-controls">
            <button 
              onClick={performAutoArrangement}
              disabled={isArranging}
              className="auto-arrange-btn"
            >
              {isArranging ? 'Arranging...' : 'Auto Arrange'}
            </button>
            <button onClick={async () => {
              await loadGuests();
              await loadTables();
            }} className="refresh-btn">
              Refresh
            </button>
          </div>
        </div>

        {/* Column 3: Auto-Arrangement Options */}
        <div className="arrangement-options">
          <h3>Auto-Arrangement Options</h3>
          <div className="options-grid">
            <label>
              <input
                type="checkbox"
                checked={autoOptions.respectRelationships}
                onChange={(e) => setAutoOptions(prev => ({
                  ...prev,
                  respectRelationships: e.target.checked
                }))}
              />
              Respect Relationships
            </label>

            <label>
              <input
                type="checkbox"
                checked={autoOptions.considerDietaryRestrictions}
                onChange={(e) => setAutoOptions(prev => ({
                  ...prev,
                  considerDietaryRestrictions: e.target.checked
                }))}
              />
              Consider Dietary Restrictions
            </label>
            <label>
              <input
                type="checkbox"
                checked={autoOptions.keepFamiliesTogether}
                onChange={(e) => setAutoOptions(prev => ({
                  ...prev,
                  keepFamiliesTogether: e.target.checked
                }))}
              />
              Keep Families Together
            </label>
          </div>
        </div>

        {/* Column 4: Relationship Legend */}
        <div className="relationship-legend">
          <h3>Relationship Color Guide</h3>
          <div className="legend-grid">
            <div className="legend-item">
              <div className="legend-color bride"></div>
              <span>Bride</span>
            </div>
            <div className="legend-item">
              <div className="legend-color groom"></div>
              <span>Groom</span>
            </div>
            <div className="legend-item">
              <div className="legend-color parent"></div>
              <span>Parents</span>
            </div>
            <div className="legend-item">
              <div className="legend-color sibling"></div>
              <span>Siblings</span>
            </div>
            <div className="legend-item">
              <div className="legend-color grandparent"></div>
              <span>Grandparents</span>
            </div>
            <div className="legend-item">
              <div className="legend-color extended"></div>
              <span>Uncles/Aunts</span>
            </div>
            <div className="legend-item">
              <div className="legend-color cousin"></div>
              <span>Cousins</span>
            </div>
            <div className="legend-item">
              <div className="legend-color friend"></div>
              <span>Friends</span>
            </div>
            <div className="legend-item">
              <div className="legend-color colleague"></div>
              <span>Colleagues</span>
            </div>
            <div className="legend-item">
              <div className="legend-color other"></div>
              <span>Other</span>
            </div>
          </div>
        </div>
      </div>



      {/* Undo/Redo Controls */}
      <div className="undo-redo-controls" style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={undoLastAssignment}
          disabled={currentHistoryIndex < 0}
          title="Undo last assignment"
          style={{
            padding: '8px 16px',
            border: '1px solid #007bff',
            background: currentHistoryIndex >= 0 ? 'white' : '#f8f9fa',
            color: currentHistoryIndex >= 0 ? '#007bff' : '#6c757d',
            borderRadius: '4px',
            cursor: currentHistoryIndex >= 0 ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ↶ Undo
        </button>
        <button 
          onClick={redoAssignment}
          disabled={currentHistoryIndex >= assignmentHistory.length - 1}
          title="Redo assignment"
          style={{
            padding: '8px 16px',
            border: '1px solid #007bff',
            background: currentHistoryIndex < assignmentHistory.length - 1 ? 'white' : '#f8f9fa',
            color: currentHistoryIndex < assignmentHistory.length - 1 ? '#007bff' : '#6c757d',
            borderRadius: '4px',
            cursor: currentHistoryIndex < assignmentHistory.length - 1 ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ↷ Redo
        </button>
        <button 
          onClick={resetAllAssignments}
          title="Reset all table assignments"
          style={{
            padding: '8px 16px',
            border: '1px solid #dc3545',
            background: 'white',
            color: '#dc3545',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '10px'
          }}
        >
          🔄 Reset All
        </button>
        {assignmentHistory.length > 0 && (
          <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>
            {assignmentHistory.length} actions available
          </span>
        )}
      </div>

      <div className="arrangement-content">
        <div className="guest-lists">
          <div className="unseated-guests">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f9f9f9', borderBottom: '1px solid #eee', borderRadius: '8px 8px 0 0' }}>
              <h3 style={{ margin: 0 }}>Unassigned Guests ({unseatedGuests.length})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={toggleBulkSelection}
                  className={bulkSelection.isActive ? 'active' : ''}
                  style={{ 
                    padding: '6px 12px', 
                    border: '1px solid #007bff', 
                    background: bulkSelection.isActive ? '#007bff' : 'white',
                    color: bulkSelection.isActive ? 'white' : '#007bff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                >
                  {bulkSelection.isActive ? 'Exit Bulk' : 'Bulk Select'}
                </button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {bulkSelection.isActive && (
              <div className="bulk-actions-bar">
                <span className="selected-count">
                  {bulkSelection.selectedGuestIds.size} selected
                </span>
                <button onClick={selectAllUnseatedGuests}>
                  Select All
                </button>
                <button onClick={clearSelection}>
                  Clear
                </button>
                <button 
                  onClick={bulkUnassignGuests}
                  disabled={bulkSelection.selectedGuestIds.size === 0}
                  className="danger"
                >
                  Unassign Selected
                </button>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkAssignToTable(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={bulkSelection.selectedGuestIds.size === 0}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Assign to Table...</option>
                  {tables.filter(t => !t.isLocked).map(table => (
                    <option key={table.id} value={table.id}>
                      {table.name} ({getTableCapacityInfo(table).available} available)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div 
              className={`guest-list unseated-drop-zone ${bulkSelection.isActive ? 'bulk-selection-mode' : ''} ${
                dragState.dragOverTable === 'unseated' ? 'drag-over' : ''
              }`}
              onDragOver={(e) => handleTableDragOver(e)}
              onDragLeave={handleTableDragLeave}
              onDrop={handleUnseatedDrop}
            >
              {unseatedGuests.length === 0 ? (
                <div className="empty-state">All guests are assigned to tables</div>
              ) : (
                unseatedGuests.map(guest => (
                  <div
                    key={guest.id}
                    className={`guest-item ${bulkSelection.isActive && bulkSelection.selectedGuestIds.has(guest.id) ? 'selected' : ''}`}
                    data-relationship={guest.relationshipType}
                    draggable={!bulkSelection.isActive}
                    onDragStart={(e) => !bulkSelection.isActive && handleGuestDragStart(e, guest)}
                    onDragEnd={handleGuestDragEnd}
                    onClick={() => bulkSelection.isActive && toggleGuestSelection(guest.id)}
                    style={{ cursor: bulkSelection.isActive ? 'pointer' : 'grab' }}
                  >
                    <div className="guest-name">
                      {guest.name}
                      {guest.additionalGuestCount > 0 && (
                        <span className="additional-guests">+{guest.additionalGuestCount}</span>
                      )}
                    </div>
                    <div className="guest-details">
                      <span className="guest-side">{guest.brideOrGroomSide}</span>
                      <span className="guest-relationship">{guest.relationshipType}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="table-arrangement">
          <div className="table-grid">
            {tables.length === 0 ? (
              <div className="empty-state">No tables available. Please add tables first.</div>
            ) : (
              tables.map(table => {
                const tableGuests = getGuestsByTable(table.id);
                const capacityInfo = getTableCapacityInfo(table);
                const isDragOver = dragState.dragOverTable === table.id;
                const dragValidation = dragState.dragValidation;
                
                // Determine drag state classes
                let dragClass = '';
                if (isDragOver && dragValidation) {
                  if (table.isLocked && dragState.draggedGuest?.tableId !== table.id) {
                    dragClass = 'drag-locked';
                  } else if (!dragValidation.isValid) {
                    dragClass = 'drag-invalid';
                  } else {
                    dragClass = 'drag-over';
                  }
                }
                
                return (
                  <div
                    key={table.id}
                    className={`table-card ${capacityInfo.isOverCapacity ? 'over-capacity' : ''} ${table.isLocked ? 'locked' : ''} ${dragClass}`}
                    onDragOver={(e) => handleTableDragOver(e, table.id)}
                    onDragLeave={handleTableDragLeave}
                    onDrop={(e) => handleTableDrop(e, table.id)}
                    onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
                  >
                    <div className="table-header">
                      <div className="table-title">
                        <h4>{table.name}</h4>
                        <button
                          className={`lock-button ${table.isLocked ? 'locked' : 'unlocked'}`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent table selection
                            toggleTableLock(table.id);
                          }}
                          title={table.isLocked ? 'Unlock table (allow auto-arrangement)' : 'Lock table (prevent auto-arrangement)'}
                        >
                          {table.isLocked ? '🔒' : '🔓'}
                        </button>
                      </div>
                      <span className="capacity-indicator">
                        {capacityInfo.occupied}/{table.capacity}
                        {capacityInfo.guestCount > 0 && capacityInfo.guestCount !== capacityInfo.occupied && 
                          ` (${capacityInfo.guestCount} guests)`
                        }
                      </span>
                    </div>

                    {/* Visual feedback for drag validation */}
                    {isDragOver && dragValidation && !dragValidation.isValid && (
                      <div className="capacity-error">
                        {dragValidation.reason}
                      </div>
                    )}

                    <div className="table-guests">
                      {tableGuests.length === 0 ? (
                        <div className="empty-table">No guests assigned</div>
                      ) : (
                        <div className="guests-compact-list">
                          {tableGuests.map((guest, index) => (
                            <span key={guest.id}>
                              <span 
                                className={`table-guest-compact ${bulkSelection.isActive && bulkSelection.selectedGuestIds.has(guest.id) ? 'selected' : ''}`}
                                data-relationship={guest.relationshipType}
                                draggable={!bulkSelection.isActive}
                                onDragStart={(e) => !bulkSelection.isActive && handleGuestDragStart(e, guest)}
                                onDragEnd={handleGuestDragEnd}
                                onClick={() => bulkSelection.isActive && toggleGuestSelection(guest.id)}
                                style={{ cursor: bulkSelection.isActive ? 'pointer' : 'grab' }}
                              >
                                {guest.name}
                                {guest.brideOrGroomSide && (
                                  <span className={`guest-side-indicator-compact ${guest.brideOrGroomSide}`}>
                                    {guest.brideOrGroomSide === 'bride' ? 'B' : 'G'}
                                  </span>
                                )}
                                {guest.additionalGuestCount > 0 && (
                                  <span className="additional-guests-compact">+{guest.additionalGuestCount}</span>
                                )}
                              </span>
                              {index < tableGuests.length - 1 && <span className="guest-separator">, </span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Enhanced drop hints with capacity info */}
                    {!isDragOver && capacityInfo.available > 0 && (
                      <div className="drop-hint">
                        Drop guests here ({capacityInfo.available} spots available)
                      </div>
                    )}

                    {isDragOver && dragValidation?.isValid && (
                      <div className="drop-hint" style={{ backgroundColor: '#d4edda', borderColor: '#28a745', color: '#155724' }}>
                        Drop to assign guest here
                      </div>
                    )}

                    {/* Bulk selection for table guests */}
                    {bulkSelection.isActive && tableGuests.length > 0 && (
                      <div style={{ marginTop: '8px', padding: '4px', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.8em' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            tableGuests.forEach(guest => toggleGuestSelection(guest.id));
                          }}
                          style={{ 
                            padding: '2px 6px', 
                            border: '1px solid #007bff', 
                            background: 'white', 
                            color: '#007bff', 
                            borderRadius: '3px', 
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
                        >
                          Select All ({tableGuests.length})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default AutoTableArrangement;