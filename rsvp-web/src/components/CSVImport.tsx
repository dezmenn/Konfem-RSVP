import React, { useState, useRef } from 'react';
import { ImportResult, ImportPreview, ImportError } from '../types';
import './CSVImport.css';

interface CSVImportProps {
  eventId: string;
  onImportComplete: (result: ImportResult) => void;
  onCancel: () => void;
}

export const CSVImport: React.FC<CSVImportProps> = ({ eventId, onImportComplete, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const previewImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch(`/api/guests/${eventId}/import/csv/preview`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setPreview(result.data);
        setStep('preview');
      } else {
        setError(result.error || 'Failed to preview CSV');
      }
    } catch (err) {
      setError('Failed to preview CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  const executeImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setStep('importing');

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch(`/api/guests/${eventId}/import/csv`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      onImportComplete(result.data);
    } catch (err) {
      setError('Failed to import CSV file');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'phoneNumber', 'dietaryRestrictions', 'additionalGuestCount', 'relationshipType', 'brideOrGroomSide', 'specialRequests'],
      ['John Doe', '+1234567890', 'Vegetarian', '1', 'Friend', 'bride', 'Needs wheelchair access'],
      ['Jane Smith', '+0987654321', 'Gluten-free,Vegan', '0', 'Cousin', 'groom', ''],
      ['Bob Johnson', '+1122334455', '', '2', 'Uncle', 'bride', 'Prefers front table']
    ];

    const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest_import_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (step === 'upload') {
    return (
      <div className="csv-import">
        <div className="csv-import-header">
          <h2>Import Guests from CSV</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="csv-import-content">
          <div className="sample-download">
            <p>Need a template? <button type="button" onClick={downloadSampleCSV} className="link-button">Download sample CSV</button></p>
          </div>

          <div 
            className={`file-drop-zone ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {file ? (
              <div className="file-selected">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ) : (
              <div className="file-drop-prompt">
                <div className="upload-icon">⬆️</div>
                <p>Drag and drop your CSV file here, or click to select</p>
                <p className="file-requirements">Supported format: CSV files up to 5MB</p>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="csv-format-info">
            <h3>CSV Format Requirements:</h3>
            <ul>
              <li><strong>name</strong> (required): Guest's full name</li>
              <li><strong>phoneNumber</strong> (required): Phone number with country code</li>
              <li><strong>dietaryRestrictions</strong> (optional): Comma-separated list</li>
              <li><strong>additionalGuestCount</strong> (optional): Number of additional guests</li>
              <li><strong>relationshipType</strong> (optional): Uncle, Aunt, Friend, etc.</li>
              <li><strong>brideOrGroomSide</strong> (optional): "bride" or "groom"</li>
              <li><strong>specialRequests</strong> (optional): Any special notes</li>
            </ul>
          </div>

          <div className="csv-import-actions">
            <button onClick={onCancel} className="cancel-button">Cancel</button>
            <button 
              onClick={previewImport} 
              disabled={!file || isLoading}
              className="preview-button"
            >
              {isLoading ? 'Loading...' : 'Preview Import'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview' && preview) {
    return (
      <div className="csv-import">
        <div className="csv-import-header">
          <h2>Import Preview</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="csv-import-content">
          <div className="preview-summary">
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-number">{preview.totalRows}</span>
                <span className="stat-label">Total Rows</span>
              </div>
              <div className="stat">
                <span className="stat-number valid">{preview.validGuests.length}</span>
                <span className="stat-label">Valid Guests</span>
              </div>
              <div className="stat">
                <span className="stat-number error">{preview.invalidRows.length}</span>
                <span className="stat-label">Errors</span>
              </div>
            </div>
          </div>

          {preview.invalidRows.length > 0 && (
            <div className="errors-section">
              <h3>Errors Found:</h3>
              <div className="errors-list">
                {preview.invalidRows.map((error, index) => (
                  <div key={index} className="error-item">
                    <span className="error-row">Row {error.row}</span>
                    {error.field && <span className="error-field">{error.field}</span>}
                    <span className="error-message">{error.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.validGuests.length > 0 && (
            <div className="valid-guests-section">
              <h3>Valid Guests ({preview.validGuests.length}):</h3>
              <div className="guests-preview">
                {preview.validGuests.slice(0, 5).map((guest, index) => (
                  <div key={index} className="guest-preview-item">
                    <div className="guest-name">{guest.name}</div>
                    <div className="guest-details">
                      {guest.phoneNumber} • {guest.relationshipType} • {guest.brideOrGroomSide} side
                      {guest.additionalGuestCount > 0 && ` • +${guest.additionalGuestCount} guests`}
                    </div>
                  </div>
                ))}
                {preview.validGuests.length > 5 && (
                  <div className="more-guests">
                    ... and {preview.validGuests.length - 5} more guests
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="csv-import-actions">
            <button onClick={() => setStep('upload')} className="back-button">Back</button>
            <button 
              onClick={executeImport} 
              disabled={preview.validGuests.length === 0 || isLoading}
              className="import-button"
            >
              {isLoading ? 'Importing...' : `Import ${preview.validGuests.length} Guests`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <div className="csv-import">
        <div className="csv-import-header">
          <h2>Importing Guests...</h2>
        </div>
        <div className="csv-import-content">
          <div className="importing-spinner">
            <div className="spinner"></div>
            <p>Please wait while we import your guests...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};