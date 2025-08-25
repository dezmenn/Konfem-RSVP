import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Guest, RelationshipType } from '../types';
import config from '../config';

interface GuestFormProps {
  eventId: string;
  guest?: Guest | null;
  visible: boolean;
  onSave: (guest: Guest) => void;
  onCancel: () => void;
}

interface GuestFormData {
  name: string;
  phoneNumber: string;
  dietaryRestrictions: string[];
  additionalGuestCount: number;
  relationshipType: RelationshipType;
  brideOrGroomSide: 'bride' | 'groom';
  rsvpStatus: 'not_invited' | 'pending' | 'accepted' | 'declined' | 'no_response';
  specialRequests: string;
}

const GuestForm: React.FC<GuestFormProps> = ({
  eventId,
  guest,
  visible,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    phoneNumber: '',
    dietaryRestrictions: [],
    additionalGuestCount: 0,
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride',
    rsvpStatus: 'not_invited',
    specialRequests: '',
  });

  const [dietaryInput, setDietaryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name,
        phoneNumber: guest.phoneNumber,
        dietaryRestrictions: [...guest.dietaryRestrictions],
        additionalGuestCount: guest.additionalGuestCount,
        relationshipType: guest.relationshipType,
        brideOrGroomSide: guest.brideOrGroomSide,
        rsvpStatus: guest.rsvpStatus,
        specialRequests: guest.specialRequests,
      });
    } else {
      // Reset form for new guest
      setFormData({
        name: '',
        phoneNumber: '',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'not_invited',
        specialRequests: '',
      });
    }
    setErrors({});
    setDietaryInput('');
  }, [guest, visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (formData.additionalGuestCount < 0) {
      newErrors.additionalGuestCount = 'Additional guest count cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof GuestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addDietaryRestriction = () => {
    if (dietaryInput.trim() && !formData.dietaryRestrictions.includes(dietaryInput.trim())) {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, dietaryInput.trim()],
      }));
      setDietaryInput('');
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.filter(r => r !== restriction),
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const url = guest ? `${config.apiBaseUrl}/api/guests/${guest.id}` : `${config.apiBaseUrl}/api/guests`;
      const method = guest ? 'PUT' : 'POST';
      
      const payload = guest 
        ? formData // For updates, send only the form data
        : { ...formData, eventId }; // For creation, include eventId

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.data);
      } else {
        if (data.errors) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((error: string) => {
            if (error.includes('Name')) errorMap.name = error;
            else if (error.includes('Phone')) errorMap.phoneNumber = error;
            else if (error.includes('Additional guest')) errorMap.additionalGuestCount = error;
            else errorMap.general = error;
          });
          setErrors(errorMap);
        } else {
          Alert.alert('Error', 'Failed to save guest');
        }
      }
    } catch (error) {
      console.error('Error saving guest:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{guest ? 'Edit Guest' : 'Add Guest'}</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.disabledButton]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter guest name"
            />
            {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="+1234567890"
              keyboardType="phone-pad"
            />
            {errors.phoneNumber && <Text style={styles.fieldError}>{errors.phoneNumber}</Text>}
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Relationship</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>{formData.relationshipType}</Text>
                {/* Note: In a real app, you'd use a proper picker component */}
              </View>
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Side</Text>
              <View style={styles.sideToggle}>
                <TouchableOpacity
                  style={[
                    styles.sideOption,
                    formData.brideOrGroomSide === 'bride' && styles.sideOptionActive,
                  ]}
                  onPress={() => handleInputChange('brideOrGroomSide', 'bride')}
                >
                  <Text
                    style={[
                      styles.sideOptionText,
                      formData.brideOrGroomSide === 'bride' && styles.sideOptionTextActive,
                    ]}
                  >
                    Bride
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sideOption,
                    formData.brideOrGroomSide === 'groom' && styles.sideOptionActive,
                  ]}
                  onPress={() => handleInputChange('brideOrGroomSide', 'groom')}
                >
                  <Text
                    style={[
                      styles.sideOptionText,
                      formData.brideOrGroomSide === 'groom' && styles.sideOptionTextActive,
                    ]}
                  >
                    Groom
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>RSVP Status</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {formData.rsvpStatus.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Additional Guests</Text>
              <TextInput
                style={[styles.input, errors.additionalGuestCount && styles.inputError]}
                value={formData.additionalGuestCount.toString()}
                onChangeText={(value) => handleInputChange('additionalGuestCount', parseInt(value) || 0)}
                keyboardType="numeric"
              />
              {errors.additionalGuestCount && (
                <Text style={styles.fieldError}>{errors.additionalGuestCount}</Text>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dietary Restrictions</Text>
            <View style={styles.dietaryInputContainer}>
              <TextInput
                style={[styles.input, styles.dietaryInput]}
                value={dietaryInput}
                onChangeText={setDietaryInput}
                placeholder="Add dietary restriction"
                onSubmitEditing={addDietaryRestriction}
              />
              <TouchableOpacity style={styles.addButton} onPress={addDietaryRestriction}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {formData.dietaryRestrictions.length > 0 && (
              <View style={styles.dietaryTags}>
                {formData.dietaryRestrictions.map((restriction, index) => (
                  <View key={index} style={styles.dietaryTag}>
                    <Text style={styles.dietaryTagText}>{restriction}</Text>
                    <TouchableOpacity
                      onPress={() => removeDietaryRestriction(restriction)}
                      style={styles.removeTag}
                    >
                      <Text style={styles.removeTagText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Special Requests</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.specialRequests}
              onChangeText={(value) => handleInputChange('specialRequests', value)}
              placeholder="Any special requests or notes..."
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007bff',
  },
  saveButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#6c757d',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  fieldError: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  sideToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sideOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  sideOptionActive: {
    backgroundColor: '#007bff',
  },
  sideOptionText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  sideOptionTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  dietaryInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  dietaryInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  dietaryTagText: {
    fontSize: 14,
    color: '#495057',
  },
  removeTag: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GuestForm;