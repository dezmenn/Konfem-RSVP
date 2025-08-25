import React, { useState } from 'react';
import './ExportManager.css';

interface ExportManagerProps {
  eventId: string;
  onExportComplete?: (result: { success: boolean; filename?: string; error?: string }) => void;
}

interface ExportOptions {
  includeVenueLayout: boolean;
  includeGuestDetails: boolean;
  includeTableAssignments: boolean;
  printOptimized: boolean;
}

const ExportManager: React.FC<ExportManagerProps> = ({ eventId, onExportComplete }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'seating-chart' | 'guest-list' | 'venue-layout'>('seating-chart');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeVenueLayout: true,
    includeGuestDetails: true,
    includeTableAssignments: true,
    printOptimized: false
  });

  const handleExport = async () => {
    if (!eventId) {
      alert('Event ID is required for export');
      return;
    }

    setIsExporting(true);

    try {
      let endpoint = '';
      let requestBody: any = { eventId, format: exportFormat };

      switch (exportType) {
        case 'seating-chart':
          endpoint = '/api/exports/seating-chart';
          requestBody.options = exportOptions;
          break;
        case 'guest-list':
          endpoint = '/api/exports/guest-list';
          break;
        case 'venue-layout':
          endpoint = '/api/exports/venue-layout';
          break;
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export-${Date.now()}.${exportFormat}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onExportComplete?.({ success: true, filename });

    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      alert(`Export failed: ${errorMessage}`);
      onExportComplete?.({ success: false, error: errorMessage });
    } finally {
      setIsExporting(false);
    }
  };

  const getAvailableFormats = () => {
    switch (exportType) {
      case 'seating-chart':
        return ['pdf', 'xlsx', 'csv'];
      case 'guest-list':
        return ['xlsx', 'csv'];
      case 'venue-layout':
        return ['pdf', 'xlsx'];
      default:
        return ['pdf'];
    }
  };

  const handleFormatChange = (format: string) => {
    if (getAvailableFormats().includes(format)) {
      setExportFormat(format as 'pdf' | 'xlsx' | 'csv');
    }
  };

  return (
    <div className="export-manager">
      <div className="export-header">
        <h3>Export Options</h3>
        <p>Generate printable reports and data exports</p>
      </div>

      <div className="export-controls">
        <div className="export-type-section">
          <label className="section-label">Export Type</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="exportType"
                value="seating-chart"
                checked={exportType === 'seating-chart'}
                onChange={(e) => setExportType(e.target.value as any)}
                disabled={isExporting}
              />
              <span>Seating Chart</span>
              <small>Complete seating arrangement with table assignments</small>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="exportType"
                value="guest-list"
                checked={exportType === 'guest-list'}
                onChange={(e) => setExportType(e.target.value as any)}
                disabled={isExporting}
              />
              <span>Guest List</span>
              <small>Detailed guest information with table assignments</small>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="exportType"
                value="venue-layout"
                checked={exportType === 'venue-layout'}
                onChange={(e) => setExportType(e.target.value as any)}
                disabled={isExporting}
              />
              <span>Venue Layout</span>
              <small>Venue layout with table positions and elements</small>
            </label>
          </div>
        </div>

        <div className="export-format-section">
          <label className="section-label">Format</label>
          <div className="format-buttons">
            {getAvailableFormats().map((format) => (
              <button
                key={format}
                className={`format-button ${exportFormat === format ? 'active' : ''}`}
                onClick={() => handleFormatChange(format)}
                disabled={isExporting}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {exportType === 'seating-chart' && (
          <div className="export-options-section">
            <label className="section-label">Options</label>
            <div className="checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={exportOptions.includeVenueLayout}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeVenueLayout: e.target.checked
                  }))}
                  disabled={isExporting}
                />
                <span>Include venue layout elements</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={exportOptions.includeGuestDetails}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeGuestDetails: e.target.checked
                  }))}
                  disabled={isExporting}
                />
                <span>Include guest details and dietary restrictions</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTableAssignments}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeTableAssignments: e.target.checked
                  }))}
                  disabled={isExporting}
                />
                <span>Include table assignment information</span>
              </label>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={exportOptions.printOptimized}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    printOptimized: e.target.checked
                  }))}
                  disabled={isExporting}
                />
                <span>Optimize layout for printing</span>
              </label>
            </div>
          </div>
        )}

        <div className="export-actions">
          <button
            className="export-button"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="loading-spinner"></span>
                Exporting...
              </>
            ) : (
              <>
                <span className="export-icon">📄</span>
                Export {exportType.replace('-', ' ')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="export-info">
        <div className="info-section">
          <h4>Export Information</h4>
          <ul>
            <li><strong>PDF:</strong> Best for printing and sharing visual layouts</li>
            <li><strong>XLSX:</strong> Ideal for data analysis and further editing</li>
            <li><strong>CSV:</strong> Compatible with most spreadsheet applications</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;