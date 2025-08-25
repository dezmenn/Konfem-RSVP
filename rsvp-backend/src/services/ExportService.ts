import { Guest, Table, VenueElement, Position, Dimensions } from '../../../shared/src/types';
import { GuestRepository } from '../repositories/GuestRepository';
import { TableRepository } from '../repositories/TableRepository';
import { VenueElementRepository } from '../repositories/VenueElementRepository';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  format: 'pdf' | 'xlsx' | 'csv';
  includeVenueLayout?: boolean;
  includeGuestDetails?: boolean;
  includeTableAssignments?: boolean;
  printOptimized?: boolean;
}

export interface SeatingChartData {
  event: {
    id: string;
    title: string;
    date: Date;
    location: string;
  };
  tables: Array<{
    id: string;
    name: string;
    capacity: number;
    position: Position;
    isLocked: boolean;
    guests: Array<{
      id: string;
      name: string;
      additionalGuestCount: number;
      dietaryRestrictions: string[];
      specialRequests: string;
    }>;
  }>;
  venueElements: VenueElement[];
  statistics: {
    totalGuests: number;
    totalSeats: number;
    occupiedSeats: number;
    availableSeats: number;
    tablesUsed: number;
    totalTables: number;
  };
}

export interface ExportResult {
  success: boolean;
  format: string;
  filename: string;
  buffer?: Buffer;
  filePath?: string;
  error?: string;
}

export class ExportService {
  private guestRepository: GuestRepository;
  private tableRepository: TableRepository;
  private venueElementRepository: VenueElementRepository;

  constructor(
    guestRepository: GuestRepository,
    tableRepository: TableRepository,
    venueElementRepository: VenueElementRepository
  ) {
    this.guestRepository = guestRepository;
    this.tableRepository = tableRepository;
    this.venueElementRepository = venueElementRepository;
  }

  async exportSeatingChart(eventId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      // Gather all data needed for export
      const seatingData = await this.gatherSeatingChartData(eventId);
      
      // Generate export based on format
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(seatingData, options);
        case 'xlsx':
          return await this.exportToExcel(seatingData, options);
        case 'csv':
          return await this.exportToCSV(seatingData, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        format: options.format,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  async exportGuestList(eventId: string, format: 'xlsx' | 'csv'): Promise<ExportResult> {
    try {
      const guests = await this.guestRepository.findByEventId(eventId);
      const tables = await this.tableRepository.getTablesWithGuests(eventId);
      
      // Create a map of table assignments for quick lookup
      const tableMap = new Map<string, string>();
      tables.forEach(table => {
        table.assignedGuests.forEach(guestId => {
          tableMap.set(guestId, table.name);
        });
      });

      const guestData = guests.map(guest => ({
        name: guest.name,
        phoneNumber: guest.phoneNumber,
        rsvpStatus: guest.rsvpStatus,
        additionalGuests: guest.additionalGuestCount,
        totalSeats: 1 + guest.additionalGuestCount,
        relationshipType: guest.relationshipType,
        brideOrGroomSide: guest.brideOrGroomSide,
        dietaryRestrictions: guest.dietaryRestrictions.join(', '),
        specialRequests: guest.specialRequests,
        tableAssignment: tableMap.get(guest.id) || 'Unassigned'
      }));

      if (format === 'csv') {
        return await this.exportGuestListToCSV(guestData);
      } else {
        return await this.exportGuestListToExcel(guestData);
      }
    } catch (error) {
      return {
        success: false,
        format,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  async exportVenueLayout(eventId: string, format: 'pdf' | 'xlsx'): Promise<ExportResult> {
    try {
      const seatingData = await this.gatherSeatingChartData(eventId);
      
      if (format === 'pdf') {
        return await this.exportVenueLayoutToPDF(seatingData);
      } else {
        return await this.exportVenueLayoutToExcel(seatingData);
      }
    } catch (error) {
      return {
        success: false,
        format,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  private async gatherSeatingChartData(eventId: string): Promise<SeatingChartData> {
    // Get all required data
    const guests = await this.guestRepository.findByEventId(eventId);
    const tables = await this.tableRepository.getTablesWithGuests(eventId);
    const venueElements = await this.venueElementRepository.findByEventId(eventId);

    // Create guest lookup map
    const guestMap = new Map(guests.map(guest => [guest.id, guest]));

    // Transform tables with guest details
    const tablesWithGuests = tables.map(table => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      position: table.position,
      isLocked: table.isLocked,
      guests: table.assignedGuests.map(guestId => {
        const guest = guestMap.get(guestId);
        if (!guest) {
          throw new Error(`Guest not found: ${guestId}`);
        }
        return {
          id: guest.id,
          name: guest.name,
          additionalGuestCount: guest.additionalGuestCount,
          dietaryRestrictions: guest.dietaryRestrictions,
          specialRequests: guest.specialRequests
        };
      })
    }));

    // Calculate statistics
    const totalGuests = guests.length;
    const totalSeats = guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
    const occupiedSeats = tablesWithGuests.reduce((sum, table) => 
      sum + table.guests.reduce((guestSum, guest) => guestSum + 1 + guest.additionalGuestCount, 0), 0
    );
    const availableSeats = tables.reduce((sum, table) => sum + table.capacity, 0) - occupiedSeats;
    const tablesUsed = tablesWithGuests.filter(table => table.guests.length > 0).length;

    return {
      event: {
        id: eventId,
        title: 'Event', // This would come from event data in a real implementation
        date: new Date(),
        location: 'Venue Location'
      },
      tables: tablesWithGuests,
      venueElements,
      statistics: {
        totalGuests,
        totalSeats,
        occupiedSeats,
        availableSeats,
        tablesUsed,
        totalTables: tables.length
      }
    };
  }

  private async exportToPDF(data: SeatingChartData, options: ExportOptions): Promise<ExportResult> {
    try {
      const filename = `seating-chart-${Date.now()}.pdf`;
      
      return new Promise<ExportResult>((resolve, reject) => {
        const doc = new PDFDocument({ 
          size: 'A4', 
          layout: options.printOptimized ? 'portrait' : 'landscape',
          margin: 50 
        });
        
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            success: true,
            format: 'pdf',
            filename,
            buffer: pdfBuffer
          });
        });
        doc.on('error', reject);

        // Add title with proper spacing
        doc.fontSize(20).font('Helvetica-Bold');
        doc.text('Seating Chart', 50, 50, { width: 500 });
        
        // Add event details with better spacing
        doc.fontSize(12).font('Helvetica');
        doc.text(`Event: ${data.event.title}`, 50, 85);
        doc.text(`Date: ${data.event.date.toLocaleDateString()}`, 50, 100);
        doc.text(`Location: ${data.event.location}`, 50, 115);

        // Add statistics if requested - positioned to avoid overlap
        if (options.includeTableAssignments) {
          const statsX = options.printOptimized ? 300 : 450;
          doc.text(`Total Guests: ${data.statistics.totalGuests}`, statsX, 85);
          doc.text(`Total Seats: ${data.statistics.totalSeats}`, statsX, 100);
          doc.text(`Tables Used: ${data.statistics.tablesUsed}/${data.statistics.totalTables}`, statsX, 115);
        }

        let yPosition = 160;

        // Draw tables layout (always show if tables exist)
        if (data.tables.length > 0) {
          doc.fontSize(16).font('Helvetica-Bold');
          doc.text(options.includeVenueLayout ? 'Venue Layout' : 'Table Layout', 50, yPosition);
          yPosition += 40; // More space after title

          // Calculate scale to fit tables and venue elements on page
          const pageWidth = doc.page.width - 100; // Account for margins
          const pageHeight = doc.page.height - yPosition - 150; // More space for legend
          
          // Find bounds of all tables and venue elements
          let minX = Math.min(...data.tables.map(t => t.position.x));
          let maxX = Math.max(...data.tables.map(t => t.position.x));
          let minY = Math.min(...data.tables.map(t => t.position.y));
          let maxY = Math.max(...data.tables.map(t => t.position.y));
          
          // Include venue elements in bounds calculation if they exist
          if (options.includeVenueLayout && data.venueElements.length > 0) {
            data.venueElements.forEach(element => {
              minX = Math.min(minX, element.position.x);
              maxX = Math.max(maxX, element.position.x + element.dimensions.width);
              minY = Math.min(minY, element.position.y);
              maxY = Math.max(maxY, element.position.y + element.dimensions.height);
            });
          }
          
          // Add padding
          const padding = 50;
          minX -= padding;
          maxX += padding;
          minY -= padding;
          maxY += padding;
          
          const venueWidth = maxX - minX;
          const venueHeight = maxY - minY;
          
          const scaleX = pageWidth / venueWidth;
          const scaleY = pageHeight / venueHeight;
          const scale = Math.min(scaleX, scaleY, 0.8); // Limit scale to prevent too large elements
          
          // Draw venue elements first if requested
          if (options.includeVenueLayout && data.venueElements.length > 0) {
            data.venueElements.forEach(element => {
              const x = 50 + (element.position.x - minX) * scale;
              const y = yPosition + (element.position.y - minY) * scale;
              const width = element.dimensions.width * scale;
              const height = element.dimensions.height * scale;
              
              // Draw element based on type
              doc.fillColor('#f0f0f0').strokeColor('#999');
              doc.rect(x, y, width, height).fillAndStroke();
              
              // Calculate appropriate font size based on element size
              const fontSize = Math.max(6, Math.min(12, Math.min(width / 8, height / 3)));
              doc.fillColor('black').fontSize(fontSize);
              
              // Get element label
              let label = '';
              switch (element.type) {
                case 'stage':
                  label = 'STAGE';
                  break;
                case 'bar':
                  label = 'BAR';
                  break;
                case 'entrance':
                  label = 'ENTRANCE';
                  break;
                case 'dance_floor':
                  label = 'DANCE FLOOR';
                  break;
                default:
                  label = element.name || element.type.toUpperCase();
              }
              
              // Center text properly within the element bounds
              const textY = y + (height / 2) - (fontSize / 2);
              doc.text(label, x + 2, textY, { 
                width: width - 4, 
                align: 'center',
                ellipsis: true
              });
            });
          }
          
          // Draw tables
          data.tables.forEach(table => {
            const x = 50 + (table.position.x - minX) * scale;
            const y = yPosition + (table.position.y - minY) * scale;
            const tableSize = Math.max(20, Math.min(40, 40 * scale)); // Constrain table size
            
            // Draw table circle
            doc.circle(x, y, tableSize);
            if (table.guests.length > 0) {
              doc.fillAndStroke('#e3f2fd', '#1976d2');
            } else {
              doc.fillAndStroke('#f5f5f5', '#666');
            }
            
            // Add table name with proper sizing
            doc.fillColor('black');
            const nameFontSize = Math.max(6, Math.min(10, tableSize / 4));
            doc.fontSize(nameFontSize).font('Helvetica-Bold');
            const nameWidth = tableSize * 2;
            doc.text(table.name, x - nameWidth/2, y - nameFontSize/2, { 
              width: nameWidth, 
              align: 'center',
              ellipsis: true
            });
            
            // Add capacity info with proper sizing
            const occupiedSeats = table.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
            const capacityFontSize = Math.max(5, Math.min(8, tableSize / 5));
            doc.fontSize(capacityFontSize).font('Helvetica');
            doc.text(`${occupiedSeats}/${table.capacity}`, x - nameWidth/2, y + nameFontSize/2 + 2, { 
              width: nameWidth, 
              align: 'center' 
            });
            
            // Add lock indicator if locked
            if (table.isLocked) {
              const lockSize = Math.max(8, Math.min(12, tableSize / 3));
              doc.fontSize(lockSize);
              doc.text('🔒', x + tableSize - lockSize, y - tableSize + lockSize/2);
            }
          });
          
          // Add legend - position it better to avoid overlap
          const layoutHeight = Math.max(...data.tables.map(t => (t.position.y - minY) * scale)) + 80;
          const legendY = Math.max(yPosition + layoutHeight + 30, yPosition + 280);
          
          if (legendY < doc.page.height - 80) {
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Legend:', 50, legendY);
            
            doc.fontSize(10).font('Helvetica');
            doc.circle(80, legendY + 20, 8).fillAndStroke('#e3f2fd', '#1976d2');
            doc.text('Occupied Table', 100, legendY + 16);
            
            doc.circle(80, legendY + 40, 8).fillAndStroke('#f5f5f5', '#666');
            doc.text('Empty Table', 100, legendY + 36);
            
            if (data.tables.some(t => t.isLocked)) {
              doc.text('🔒 Locked Table', 200, legendY + 16);
            }
            doc.text('Numbers show: occupied/capacity', 200, legendY + 36);
          }
        } else {
          doc.fontSize(14).font('Helvetica');
          doc.text('No tables have been configured for this event yet.', 50, yPosition);
          yPosition += 30;
        }

        // Add table details if requested
        if (options.includeGuestDetails) {
          // Start new page for table details
          doc.addPage();
          yPosition = 50;
          
          doc.fontSize(16).font('Helvetica-Bold');
          doc.text('Table Assignments', 50, yPosition);
          yPosition += 30;

          data.tables.forEach(table => {
            if (table.guests.length === 0) return;
            
            // Check if we need a new page
            if (yPosition > doc.page.height - 150) {
              doc.addPage();
              yPosition = 50;
            }
            
            // Table header
            doc.fontSize(14).font('Helvetica-Bold');
            doc.text(`${table.name} (${table.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0)}/${table.capacity} seats)`, 50, yPosition);
            yPosition += 20;
            
            // Guest list
            doc.fontSize(10).font('Helvetica');
            table.guests.forEach(guest => {
              const guestInfo = `• ${guest.name}`;
              const additionalInfo = guest.additionalGuestCount > 0 ? ` (+${guest.additionalGuestCount})` : '';
              const dietary = guest.dietaryRestrictions.length > 0 ? ` [${guest.dietaryRestrictions.join(', ')}]` : '';
              
              doc.text(guestInfo + additionalInfo + dietary, 70, yPosition);
              yPosition += 15;
              
              if (guest.specialRequests) {
                doc.fontSize(8).fillColor('#666');
                doc.text(`  Special: ${guest.specialRequests}`, 70, yPosition);
                doc.fillColor('black').fontSize(10);
                yPosition += 12;
              }
            });
            
            yPosition += 10; // Space between tables
          });
        }

        doc.end();
      });
    } catch (error) {
      return {
        success: false,
        format: 'pdf',
        filename: '',
        error: error instanceof Error ? error.message : 'PDF generation failed'
      };
    }
  }

  private async exportToExcel(data: SeatingChartData, options: ExportOptions): Promise<ExportResult> {
    try {
      const filename = `seating-chart-${Date.now()}.xlsx`;
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Event Summary
      const summaryData = [
        ['Event Information'],
        ['Event ID', data.event.id],
        ['Title', data.event.title],
        ['Date', data.event.date.toLocaleDateString()],
        ['Location', data.event.location],
        ['Export Date', new Date().toLocaleDateString()],
        ['Export Time', new Date().toLocaleTimeString()],
        [''],
        ['Statistics'],
        ['Total Guests', data.statistics.totalGuests],
        ['Total Seats Required', data.statistics.totalSeats],
        ['Total Venue Capacity', data.tables.reduce((sum, table) => sum + table.capacity, 0)],
        ['Occupied Seats', data.statistics.occupiedSeats],
        ['Available Seats', data.statistics.availableSeats],
        ['Tables Used', data.statistics.tablesUsed],
        ['Total Tables', data.statistics.totalTables],
        ['Venue Utilization', `${data.tables.reduce((sum, table) => sum + table.capacity, 0) > 0 ? Math.round((data.statistics.occupiedSeats / data.tables.reduce((sum, table) => sum + table.capacity, 0)) * 100) : 0}%`],
        [''],
        ['Table Status'],
        ['Occupied Tables', data.statistics.tablesUsed],
        ['Empty Tables', data.statistics.totalTables - data.statistics.tablesUsed],
        ['Locked Tables', data.tables.filter(t => t.isLocked).length],
        ['Unlocked Tables', data.tables.filter(t => !t.isLocked).length]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [
        { width: 25 }, // Label column
        { width: 20 }  // Value column
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Event Summary');
      
      // Sheet 2: Table Assignments (if requested)
      if (options.includeTableAssignments) {
        const tableData = [
          ['Table Name', 'Guest Name', 'Additional Guests', 'Total Seats', 'Dietary Restrictions', 'Special Requests', 'Table Capacity', 'Table Position X', 'Table Position Y', 'Table Locked']
        ];
        
        data.tables.forEach(table => {
          if (table.guests.length === 0) {
            // Empty table
            tableData.push([
              table.name,
              '[Empty Table]',
              0,
              0,
              '',
              '',
              table.capacity,
              table.position.x,
              table.position.y,
              table.isLocked ? 'Yes' : 'No'
            ] as any[]);
          } else {
            table.guests.forEach(guest => {
              tableData.push([
                table.name,
                guest.name,
                guest.additionalGuestCount,
                1 + guest.additionalGuestCount,
                guest.dietaryRestrictions.join(', '),
                guest.specialRequests,
                table.capacity,
                table.position.x,
                table.position.y,
                table.isLocked ? 'Yes' : 'No'
              ] as any[]);
            });
          }
        });
        
        const tableSheet = XLSX.utils.aoa_to_sheet(tableData);
        XLSX.utils.book_append_sheet(workbook, tableSheet, 'Table Assignments');
      }
      
      // Sheet 3: Table Summary
      const tableSummaryData = [
        ['Table Name', 'Capacity', 'Occupied Seats', 'Available Seats', 'Guest Count', 'Position X', 'Position Y', 'Locked', 'Utilization %']
      ];
      
      data.tables.forEach(table => {
        const occupiedSeats = table.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
        const availableSeats = table.capacity - occupiedSeats;
        const utilization = table.capacity > 0 ? Math.round((occupiedSeats / table.capacity) * 100) : 0;
        
        tableSummaryData.push([
          table.name,
          table.capacity,
          occupiedSeats,
          availableSeats,
          table.guests.length,
          table.position.x,
          table.position.y,
          table.isLocked ? 'Yes' : 'No',
          `${utilization}%`
        ] as any[]);
      });
      
      const tableSummarySheet = XLSX.utils.aoa_to_sheet(tableSummaryData);
      XLSX.utils.book_append_sheet(workbook, tableSummarySheet, 'Table Summary');
      
      // Sheet 4: Visual Layout (if requested)
      if (options.includeVenueLayout) {
        const layoutSheet = this.createVisualLayoutSheet(data);
        XLSX.utils.book_append_sheet(workbook, layoutSheet, 'Visual Layout');
      }
      
      // Sheet 5: Venue Elements (if requested and available)
      if (options.includeVenueLayout && data.venueElements.length > 0) {
        const venueData = [
          ['Element Name', 'Type', 'Position X', 'Position Y', 'Width', 'Height']
        ];
        
        data.venueElements.forEach(element => {
          venueData.push([
            element.name || element.type,
            element.type,
            element.position.x,
            element.position.y,
            element.dimensions.width,
            element.dimensions.height
          ] as any[]);
        });
        
        const venueSheet = XLSX.utils.aoa_to_sheet(venueData);
        XLSX.utils.book_append_sheet(workbook, venueSheet, 'Venue Elements');
      }
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return {
        success: true,
        format: 'xlsx',
        filename,
        buffer: excelBuffer
      };
    } catch (error) {
      return {
        success: false,
        format: 'xlsx',
        filename: '',
        error: error instanceof Error ? error.message : 'Excel generation failed'
      };
    }
  }

  private createVisualLayoutSheet(data: SeatingChartData): any {
    // Create a grid-based visual representation
    const gridSize = 30; // 30x30 grid
    const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    
    // Find bounds of all elements
    let minX = 0, maxX = 800, minY = 0, maxY = 600;
    
    if (data.tables.length > 0) {
      minX = Math.min(...data.tables.map(t => t.position.x));
      maxX = Math.max(...data.tables.map(t => t.position.x));
      minY = Math.min(...data.tables.map(t => t.position.y));
      maxY = Math.max(...data.tables.map(t => t.position.y));
    }
    
    if (data.venueElements.length > 0) {
      data.venueElements.forEach(element => {
        minX = Math.min(minX, element.position.x);
        maxX = Math.max(maxX, element.position.x + element.dimensions.width);
        minY = Math.min(minY, element.position.y);
        maxY = Math.max(maxY, element.position.y + element.dimensions.height);
      });
    }
    
    // Add padding
    const padding = 50;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    
    const scaleX = (gridSize - 2) / (maxX - minX);
    const scaleY = (gridSize - 2) / (maxY - minY);
    
    // Place venue elements first
    data.venueElements.forEach(element => {
      const startX = Math.max(0, Math.min(gridSize - 1, Math.round((element.position.x - minX) * scaleX)));
      const endX = Math.max(0, Math.min(gridSize - 1, Math.round((element.position.x + element.dimensions.width - minX) * scaleX)));
      const startY = Math.max(0, Math.min(gridSize - 1, Math.round((element.position.y - minY) * scaleY)));
      const endY = Math.max(0, Math.min(gridSize - 1, Math.round((element.position.y + element.dimensions.height - minY) * scaleY)));
      
      // Fill the area with element representation
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          if (y < gridSize && x < gridSize) {
            switch (element.type) {
              case 'stage':
                grid[y][x] = '🎭';
                break;
              case 'bar':
                grid[y][x] = '🍺';
                break;
              case 'entrance':
                grid[y][x] = '🚪';
                break;
              case 'dance_floor':
                grid[y][x] = '💃';
                break;
              default:
                grid[y][x] = '⬜';
            }
          }
        }
      }
    });
    
    // Place tables
    data.tables.forEach(table => {
      const x = Math.max(0, Math.min(gridSize - 1, Math.round((table.position.x - minX) * scaleX)));
      const y = Math.max(0, Math.min(gridSize - 1, Math.round((table.position.y - minY) * scaleY)));
      
      if (y < gridSize && x < gridSize) {
        if (table.guests.length > 0) {
          grid[y][x] = table.isLocked ? '🔒' : '🔵'; // Blue circle for occupied
        } else {
          grid[y][x] = '⚪'; // White circle for empty
        }
      }
    });
    
    // Create the layout data with headers and legend
    const layoutData: any[][] = [
      ['VENUE LAYOUT VISUALIZATION'],
      [''],
      ['Legend:'],
      ['🔵 = Occupied Table', '⚪ = Empty Table', '🔒 = Locked Table'],
      ['🎭 = Stage', '🍺 = Bar', '🚪 = Entrance', '💃 = Dance Floor'],
      ['⬜ = Other Venue Element'],
      [''],
      ['Layout Grid:'],
      ['']
    ];
    
    // Add the grid
    for (let y = 0; y < gridSize; y++) {
      const row: string[] = [];
      for (let x = 0; x < gridSize; x++) {
        row.push(grid[y][x] || '  ');
      }
      layoutData.push(row);
    }
    
    // Add table details below the grid
    layoutData.push(['']);
    layoutData.push(['TABLE DETAILS:']);
    layoutData.push(['Table Name', 'Status', 'Occupancy', 'Position', 'Guests']);
    
    data.tables.forEach(table => {
      const occupiedSeats = table.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      const status = table.isLocked ? 'Locked' : (table.guests.length > 0 ? 'Occupied' : 'Empty');
      const occupancy = `${occupiedSeats}/${table.capacity}`;
      const position = `(${table.position.x}, ${table.position.y})`;
      const guestNames = table.guests.map(g => g.name).join(', ') || 'None';
      
      layoutData.push([
        table.name,
        status,
        occupancy,
        position,
        guestNames
      ]);
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(layoutData);
    
    // Set column widths
    const cols = Array(Math.max(gridSize, 5)).fill({ width: 3 });
    cols[0] = { width: 15 }; // First column wider for labels
    if (cols.length > 4) {
      cols[4] = { width: 30 }; // Guest names column wider
    }
    worksheet['!cols'] = cols;
    
    // Set row heights for the grid area
    const rows = Array(layoutData.length).fill({ hpt: 15 });
    // Make header rows taller
    for (let i = 0; i < 9; i++) {
      rows[i] = { hpt: 20 };
    }
    worksheet['!rows'] = rows;
    
    return worksheet;
  }

  private async exportToCSV(data: SeatingChartData, options: ExportOptions): Promise<ExportResult> {
    try {
      const filename = `seating-chart-${Date.now()}.csv`;
      
      // Create CSV content for seating chart
      const csvLines: string[] = [];
      
      // Add header
      csvLines.push('Table Name,Guest Name,Additional Guests,Total Seats,Dietary Restrictions,Special Requests,Table Position X,Table Position Y');
      
      // Add table and guest data
      data.tables.forEach(table => {
        if (table.guests.length === 0) {
          // Empty table
          csvLines.push(`"${table.name}","[Empty Table]",0,0,"","",${table.position.x},${table.position.y}`);
        } else {
          table.guests.forEach(guest => {
            const dietaryRestrictions = guest.dietaryRestrictions.join('; ');
            const specialRequests = guest.specialRequests.replace(/"/g, '""'); // Escape quotes
            csvLines.push(
              `"${table.name}","${guest.name}",${guest.additionalGuestCount},${1 + guest.additionalGuestCount},"${dietaryRestrictions}","${specialRequests}",${table.position.x},${table.position.y}`
            );
          });
        }
      });
      
      // Add statistics section
      csvLines.push('');
      csvLines.push('Statistics');
      csvLines.push(`Total Guests,${data.statistics.totalGuests}`);
      csvLines.push(`Total Seats Required,${data.statistics.totalSeats}`);
      csvLines.push(`Occupied Seats,${data.statistics.occupiedSeats}`);
      csvLines.push(`Available Seats,${data.statistics.availableSeats}`);
      csvLines.push(`Tables Used,${data.statistics.tablesUsed}`);
      csvLines.push(`Total Tables,${data.statistics.totalTables}`);
      
      const csvContent = csvLines.join('\n');
      
      return {
        success: true,
        format: 'csv',
        filename,
        buffer: Buffer.from(csvContent, 'utf-8')
      };
    } catch (error) {
      throw new Error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async exportGuestListToCSV(guestData: any[]): Promise<ExportResult> {
    try {
      const filename = `guest-list-${Date.now()}.csv`;
      
      // Create CSV header
      const headers = [
        'Name', 'Phone Number', 'RSVP Status', 'Additional Guests', 'Total Seats',
        'Relationship Type', 'Bride/Groom Side', 'Dietary Restrictions', 
        'Special Requests', 'Table Assignment'
      ];
      
      const csvLines: string[] = [headers.join(',')];
      
      // Add guest data
      guestData.forEach(guest => {
        const row = [
          `"${guest.name}"`,
          `"${guest.phoneNumber}"`,
          guest.rsvpStatus,
          guest.additionalGuests,
          guest.totalSeats,
          guest.relationshipType,
          guest.brideOrGroomSide,
          `"${guest.dietaryRestrictions}"`,
          `"${guest.specialRequests.replace(/"/g, '""')}"`,
          `"${guest.tableAssignment}"`
        ];
        csvLines.push(row.join(','));
      });
      
      const csvContent = csvLines.join('\n');
      
      return {
        success: true,
        format: 'csv',
        filename,
        buffer: Buffer.from(csvContent, 'utf-8')
      };
    } catch (error) {
      throw new Error(`Guest list CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async exportGuestListToExcel(guestData: any[]): Promise<ExportResult> {
    try {
      const filename = `guest-list-${Date.now()}.xlsx`;
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = [
        ['Name', 'Phone Number', 'RSVP Status', 'Additional Guests', 'Total Seats', 'Relationship Type', 'Bride/Groom Side', 'Dietary Restrictions', 'Special Requests', 'Table Assignment']
      ];
      
      // Add guest data
      guestData.forEach(guest => {
        excelData.push([
          guest.name,
          guest.phoneNumber,
          guest.rsvpStatus,
          guest.additionalGuests,
          guest.totalSeats,
          guest.relationshipType,
          guest.brideOrGroomSide,
          guest.dietaryRestrictions,
          guest.specialRequests,
          guest.tableAssignment
        ] as any[]);
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Add some basic formatting
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Set column widths
      worksheet['!cols'] = [
        { width: 20 }, // Name
        { width: 15 }, // Phone Number
        { width: 12 }, // RSVP Status
        { width: 15 }, // Additional Guests
        { width: 12 }, // Total Seats
        { width: 18 }, // Relationship Type
        { width: 15 }, // Bride/Groom Side
        { width: 25 }, // Dietary Restrictions
        { width: 30 }, // Special Requests
        { width: 15 }  // Table Assignment
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Guest List');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return {
        success: true,
        format: 'xlsx',
        filename,
        buffer: excelBuffer
      };
    } catch (error) {
      return {
        success: false,
        format: 'xlsx',
        filename: '',
        error: error instanceof Error ? error.message : 'Excel guest list generation failed'
      };
    }
  }

  private async exportVenueLayoutToPDF(data: SeatingChartData): Promise<ExportResult> {
    try {
      const filename = `venue-layout-${Date.now()}.pdf`;
      
      return new Promise<ExportResult>((resolve, reject) => {
        const doc = new PDFDocument({ 
          size: 'A4', 
          layout: 'landscape',
          margin: 50 
        });
        
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            success: true,
            format: 'pdf',
            filename,
            buffer: pdfBuffer
          });
        });
        doc.on('error', reject);

        // Add title
        doc.fontSize(20).font('Helvetica-Bold');
        doc.text('Venue Layout', 50, 50);
        
        // Add event details
        doc.fontSize(12).font('Helvetica');
        doc.text(`Event: ${data.event.title}`, 50, 80);
        doc.text(`Date: ${data.event.date.toLocaleDateString()}`, 50, 95);
        doc.text(`Location: ${data.event.location}`, 50, 110);

        let yPosition = 150;

        if (data.tables.length > 0) {
          // Calculate scale to fit tables on page
          const pageWidth = doc.page.width - 100;
          const pageHeight = doc.page.height - yPosition - 50;
          
          // Find bounds of all tables
          let minX = Math.min(...data.tables.map(t => t.position.x));
          let maxX = Math.max(...data.tables.map(t => t.position.x));
          let minY = Math.min(...data.tables.map(t => t.position.y));
          let maxY = Math.max(...data.tables.map(t => t.position.y));
          
          // Add padding
          const padding = 100;
          minX -= padding;
          maxX += padding;
          minY -= padding;
          maxY += padding;
          
          const venueWidth = maxX - minX;
          const venueHeight = maxY - minY;
          
          const scaleX = pageWidth / venueWidth;
          const scaleY = pageHeight / venueHeight;
          const scale = Math.min(scaleX, scaleY, 1);
          
          // Draw venue elements first (if any)
          data.venueElements.forEach(element => {
            const x = 50 + (element.position.x - minX) * scale;
            const y = yPosition + (element.position.y - minY) * scale;
            const width = element.dimensions.width * scale;
            const height = element.dimensions.height * scale;
            
            // Draw element based on type
            doc.fillColor('#f0f0f0').strokeColor('#999');
            doc.rect(x, y, width, height).fillAndStroke();
            
            // Calculate appropriate font size based on element size
            const fontSize = Math.max(6, Math.min(12, Math.min(width / 8, height / 3)));
            doc.fillColor('black').fontSize(fontSize);
            
            // Get element label
            let label = '';
            switch (element.type) {
              case 'stage':
                label = 'STAGE';
                break;
              case 'bar':
                label = 'BAR';
                break;
              case 'entrance':
                label = 'ENTRANCE';
                break;
              case 'dance_floor':
                label = 'DANCE FLOOR';
                break;
              default:
                label = element.name || element.type.toUpperCase();
            }
            
            // Center text properly within the element bounds
            const textY = y + (height / 2) - (fontSize / 2);
            doc.text(label, x + 2, textY, { 
              width: width - 4, 
              align: 'center',
              ellipsis: true
            });
          });
          
          // Draw tables
          data.tables.forEach(table => {
            const x = 50 + (table.position.x - minX) * scale;
            const y = yPosition + (table.position.y - minY) * scale;
            const tableSize = Math.max(25, Math.min(50, 50 * scale)); // Constrain table size
            
            // Draw table circle
            doc.circle(x, y, tableSize);
            if (table.guests.length > 0) {
              doc.fillAndStroke('#e3f2fd', '#1976d2');
            } else {
              doc.fillAndStroke('#f5f5f5', '#666');
            }
            
            // Add table name with proper sizing
            doc.fillColor('black');
            const nameFontSize = Math.max(8, Math.min(12, tableSize / 4));
            doc.fontSize(nameFontSize).font('Helvetica-Bold');
            const nameWidth = tableSize * 1.6;
            doc.text(table.name, x - nameWidth/2, y - nameFontSize/2, { 
              width: nameWidth, 
              align: 'center',
              ellipsis: true
            });
            
            // Add capacity info with proper sizing
            const occupiedSeats = table.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
            const capacityFontSize = Math.max(6, Math.min(10, tableSize / 6));
            doc.fontSize(capacityFontSize).font('Helvetica');
            doc.text(`${occupiedSeats}/${table.capacity}`, x - nameWidth/2, y + nameFontSize/2 + 2, { 
              width: nameWidth, 
              align: 'center' 
            });
            
            // Add lock indicator if locked
            if (table.isLocked) {
              const lockSize = Math.max(10, Math.min(14, tableSize / 4));
              doc.fontSize(lockSize);
              doc.text('🔒', x + tableSize - lockSize, y - tableSize + lockSize/2);
            }
          });
          
          // Add legend
          const legendY = doc.page.height - 100;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Legend:', 50, legendY);
          
          doc.fontSize(10).font('Helvetica');
          doc.circle(80, legendY + 20, 8).fillAndStroke('#e3f2fd', '#1976d2');
          doc.text('Occupied Table', 100, legendY + 16);
          
          doc.circle(80, legendY + 40, 8).fillAndStroke('#f5f5f5', '#666');
          doc.text('Empty Table', 100, legendY + 36);
          
          doc.text('🔒 Locked Table', 200, legendY + 16);
          doc.text('Numbers show: occupied/capacity', 200, legendY + 36);
        } else {
          doc.fontSize(14).font('Helvetica');
          doc.text('No tables configured for this venue.', 50, yPosition);
        }

        doc.end();
      });
    } catch (error) {
      return {
        success: false,
        format: 'pdf',
        filename: '',
        error: error instanceof Error ? error.message : 'PDF venue layout generation failed'
      };
    }
  }

  private async exportVenueLayoutToExcel(data: SeatingChartData): Promise<ExportResult> {
    try {
      const filename = `venue-layout-${Date.now()}.xlsx`;
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Event Information
      const eventData = [
        ['Venue Layout Export'],
        ['Event ID', data.event.id],
        ['Title', data.event.title],
        ['Date', data.event.date.toLocaleDateString()],
        ['Location', data.event.location],
        [''],
        ['Export Date', new Date().toLocaleDateString()],
        ['Export Time', new Date().toLocaleTimeString()]
      ];
      
      const eventSheet = XLSX.utils.aoa_to_sheet(eventData);
      XLSX.utils.book_append_sheet(workbook, eventSheet, 'Event Info');
      
      // Sheet 2: Table Layout
      const tableLayoutData = [
        ['Table Name', 'Capacity', 'Position X', 'Position Y', 'Occupied Seats', 'Available Seats', 'Locked', 'Utilization %', 'Guest Count']
      ];
      
      data.tables.forEach(table => {
        const occupiedSeats = table.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
        const availableSeats = table.capacity - occupiedSeats;
        const utilization = table.capacity > 0 ? Math.round((occupiedSeats / table.capacity) * 100) : 0;
        
        tableLayoutData.push([
          table.name,
          table.capacity,
          table.position.x,
          table.position.y,
          occupiedSeats,
          availableSeats,
          table.isLocked ? 'Yes' : 'No',
          `${utilization}%`,
          table.guests.length
        ] as any[]);
      });
      
      const tableLayoutSheet = XLSX.utils.aoa_to_sheet(tableLayoutData);
      
      // Set column widths for table layout
      tableLayoutSheet['!cols'] = [
        { width: 15 }, // Table Name
        { width: 10 }, // Capacity
        { width: 12 }, // Position X
        { width: 12 }, // Position Y
        { width: 15 }, // Occupied Seats
        { width: 15 }, // Available Seats
        { width: 10 }, // Locked
        { width: 15 }, // Utilization %
        { width: 12 }  // Guest Count
      ];
      
      XLSX.utils.book_append_sheet(workbook, tableLayoutSheet, 'Table Layout');
      
      // Sheet 3: Venue Elements (if any)
      if (data.venueElements.length > 0) {
        const venueElementsData = [
          ['Element Name', 'Type', 'Position X', 'Position Y', 'Width', 'Height']
        ];
        
        data.venueElements.forEach(element => {
          venueElementsData.push([
            element.name || element.type,
            element.type,
            element.position.x,
            element.position.y,
            element.dimensions.width,
            element.dimensions.height
          ] as any[]);
        });
        
        const venueElementsSheet = XLSX.utils.aoa_to_sheet(venueElementsData);
        
        // Set column widths for venue elements
        venueElementsSheet['!cols'] = [
          { width: 20 }, // Element Name
          { width: 15 }, // Type
          { width: 12 }, // Position X
          { width: 12 }, // Position Y
          { width: 10 }, // Width
          { width: 10 }  // Height
        ];
        
        XLSX.utils.book_append_sheet(workbook, venueElementsSheet, 'Venue Elements');
      }
      
      // Sheet 4: Visual Layout
      const layoutSheet = this.createVisualLayoutSheet(data);
      XLSX.utils.book_append_sheet(workbook, layoutSheet, 'Visual Layout');
      
      // Sheet 5: Layout Statistics
      const statsData = [
        ['Layout Statistics'],
        [''],
        ['Total Tables', data.statistics.totalTables],
        ['Tables Used', data.statistics.tablesUsed],
        ['Tables Empty', data.statistics.totalTables - data.statistics.tablesUsed],
        [''],
        ['Total Guests', data.statistics.totalGuests],
        ['Total Seats Required', data.statistics.totalSeats],
        ['Total Venue Capacity', data.tables.reduce((sum, table) => sum + table.capacity, 0)],
        ['Occupied Seats', data.statistics.occupiedSeats],
        ['Available Seats', data.statistics.availableSeats],
        [''],
        ['Venue Utilization', `${data.tables.reduce((sum, table) => sum + table.capacity, 0) > 0 ? Math.round((data.statistics.occupiedSeats / data.tables.reduce((sum, table) => sum + table.capacity, 0)) * 100) : 0}%`],
        ['Venue Elements', data.venueElements.length]
      ];
      
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return {
        success: true,
        format: 'xlsx',
        filename,
        buffer: excelBuffer
      };
    } catch (error) {
      return {
        success: false,
        format: 'xlsx',
        filename: '',
        error: error instanceof Error ? error.message : 'Excel venue layout generation failed'
      };
    }
  }
}