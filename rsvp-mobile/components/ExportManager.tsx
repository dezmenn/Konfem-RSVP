import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import config from '../config';

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
      Alert.alert('Error', 'Event ID is required for export');
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

      const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
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

      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const fileUri = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Export Complete', `File saved at: ${fileUri}`);
        }
      };

      onExportComplete?.({ success: true, filename });

    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      Alert.alert('Export Failed', errorMessage);
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

  const toggleOption = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Export Options</Text>
        <Text style={styles.subtitle}>Generate printable reports and data exports</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Export Type</Text>
        
        <TouchableOpacity
          style={[styles.radioOption, exportType === 'seating-chart' && styles.radioOptionSelected]}
          onPress={() => setExportType('seating-chart')}
          disabled={isExporting}
        >
          <View style={[styles.radioCircle, exportType === 'seating-chart' && styles.radioCircleSelected]} />
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, exportType === 'seating-chart' && styles.radioLabelSelected]}>
              Seating Chart
            </Text>
            <Text style={styles.radioDescription}>
              Complete seating arrangement with table assignments
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioOption, exportType === 'guest-list' && styles.radioOptionSelected]}
          onPress={() => setExportType('guest-list')}
          disabled={isExporting}
        >
          <View style={[styles.radioCircle, exportType === 'guest-list' && styles.radioCircleSelected]} />
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, exportType === 'guest-list' && styles.radioLabelSelected]}>
              Guest List
            </Text>
            <Text style={styles.radioDescription}>
              Detailed guest information with table assignments
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioOption, exportType === 'venue-layout' && styles.radioOptionSelected]}
          onPress={() => setExportType('venue-layout')}
          disabled={isExporting}
        >
          <View style={[styles.radioCircle, exportType === 'venue-layout' && styles.radioCircleSelected]} />
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, exportType === 'venue-layout' && styles.radioLabelSelected]}>
              Venue Layout
            </Text>
            <Text style={styles.radioDescription}>
              Venue layout with table positions and elements
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Format</Text>
        <View style={styles.formatButtons}>
          {getAvailableFormats().map((format) => (
            <TouchableOpacity
              key={format}
              style={[
                styles.formatButton,
                exportFormat === format && styles.formatButtonActive
              ]}
              onPress={() => handleFormatChange(format)}
              disabled={isExporting}
            >
              <Text style={[
                styles.formatButtonText,
                exportFormat === format && styles.formatButtonTextActive
              ]}>
                {format.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {exportType === 'seating-chart' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Options</Text>
          
          <TouchableOpacity
            style={styles.checkboxOption}
            onPress={() => toggleOption('includeVenueLayout')}
            disabled={isExporting}
          >
            <View style={[styles.checkbox, exportOptions.includeVenueLayout && styles.checkboxChecked]}>
              {exportOptions.includeVenueLayout && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Include venue layout elements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxOption}
            onPress={() => toggleOption('includeGuestDetails')}
            disabled={isExporting}
          >
            <View style={[styles.checkbox, exportOptions.includeGuestDetails && styles.checkboxChecked]}>
              {exportOptions.includeGuestDetails && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Include guest details and dietary restrictions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxOption}
            onPress={() => toggleOption('includeTableAssignments')}
            disabled={isExporting}
          >
            <View style={[styles.checkbox, exportOptions.includeTableAssignments && styles.checkboxChecked]}>
              {exportOptions.includeTableAssignments && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Include table assignment information</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxOption}
            onPress={() => toggleOption('printOptimized')}
            disabled={isExporting}
          >
            <View style={[styles.checkbox, exportOptions.printOptimized && styles.checkboxChecked]}>
              {exportOptions.printOptimized && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Optimize layout for printing</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.exportActions}>
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.exportButtonText}>Exporting...</Text>
            </>
          ) : (
            <>
              <Text style={styles.exportIcon}>📄</Text>
              <Text style={styles.exportButtonText}>
                Export {exportType.replace('-', ' ')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Export Information</Text>
        <Text style={styles.infoText}>• <Text style={styles.infoBold}>PDF:</Text> Best for printing and sharing visual layouts</Text>
        <Text style={styles.infoText}>• <Text style={styles.infoBold}>XLSX:</Text> Ideal for data analysis and further editing</Text>
        <Text style={styles.infoText}>• <Text style={styles.infoBold}>CSV:</Text> Compatible with most spreadsheet applications</Text>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center' as const,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    marginBottom: 12,
  },
  radioOptionSelected: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9fa',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    marginRight: 12,
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#007bff',
    backgroundColor: '#007bff',
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#333',
    marginBottom: 4,
  },
  radioLabelSelected: {
    color: '#007bff',
    fontWeight: '600' as const,
  },
  radioDescription: {
    fontSize: 13,
    color: '#666',
  },
  formatButtons: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  formatButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    backgroundColor: 'white',
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  formatButtonActive: {
    borderColor: '#007bff',
    backgroundColor: '#007bff',
  },
  formatButtonText: {
    fontWeight: '500' as const,
    color: '#333',
  },
  formatButtonTextActive: {
    color: 'white',
  },
  checkboxOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 6,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxChecked: {
    borderColor: '#007bff',
    backgroundColor: '#007bff',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500' as const,
  },
  exportActions: {
    margin: 16,
    alignItems: 'center' as const,
  },
  exportButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    minWidth: 200,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  exportIcon: {
    fontSize: 18,
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600' as const,
    color: '#333',
  },
};

export default ExportManager;