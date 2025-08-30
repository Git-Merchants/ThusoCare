import React, { useState } from 'react';
import '../Styling/HealthProfile.css';
import { useAuth } from '../context/AuthContext'; // Fixed import
import { createClient } from '@supabase/supabase-js';

// Create supabase client (or better yet, export it from AuthContext and import it)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const HealthProfile = () => {
  const { user, loading, error: authError } = useAuth(); // Fixed usage and added loading/error
  const [healthData, setHealthData] = useState({
    bloodType: '',
    chronicDiseases: [],
    allergies: [],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medications: [],
    height: '',
    weight: '',
    additionalNotes: ''
  });

  const [newDisease, setNewDisease] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

  // Show loading state
  if (loading) {
    return (
      <div className="health-profile-container">
        <div className="health-profile-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="health-profile-container">
        <div className="health-profile-card">
          <p className="error-message">Authentication error: {authError}</p>
        </div>
      </div>
    );
  }

  // Show login requirement
  if (!user) {
    return (
      <div className="health-profile-container">
        <div className="health-profile-card">
          <p className="error-message">Please log in to access your health profile.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHealthData({
      ...healthData,
      [name]: value
    });
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setHealthData({
      ...healthData,
      emergencyContact: {
        ...healthData.emergencyContact,
        [name]: value
      }
    });
  };

  const addChronicDisease = () => {
    if (newDisease.trim() !== '') {
      setHealthData({
        ...healthData,
        chronicDiseases: [...healthData.chronicDiseases, newDisease.trim()]
      });
      setNewDisease('');
    }
  };

  const removeChronicDisease = (index) => {
    const updatedDiseases = [...healthData.chronicDiseases];
    updatedDiseases.splice(index, 1);
    setHealthData({
      ...healthData,
      chronicDiseases: updatedDiseases
    });
  };

  const addAllergy = () => {
    if (newAllergy.trim() !== '') {
      setHealthData({
        ...healthData,
        allergies: [...healthData.allergies, newAllergy.trim()]
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (index) => {
    const updatedAllergies = [...healthData.allergies];
    updatedAllergies.splice(index, 1);
    setHealthData({
      ...healthData,
      allergies: updatedAllergies
    });
  };

  const addMedication = () => {
    if (newMedication.name.trim() !== '') {
      setHealthData({
        ...healthData,
        medications: [...healthData.medications, { ...newMedication }]
      });
      setNewMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index) => {
    const updatedMedications = [...healthData.medications];
    updatedMedications.splice(index, 1);
    setHealthData({
      ...healthData,
      medications: updatedMedications
    });
  };

  const handleMedicationChange = (e) => {
    const { name, value } = e.target;
    setNewMedication({
      ...newMedication,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('info').insert({
        user_id: user.id,
        height: healthData.height ? parseFloat(healthData.height) : null,
        weight: healthData.weight ? parseFloat(healthData.weight) : null,
        blood_type: healthData.bloodType,
        chronic_diseases: healthData.chronicDiseases.join(', '),
        allergies: healthData.allergies.join(', '),
        medication: healthData.medications.map(med => `${med.name} (${med.dosage}, ${med.frequency})`).join('; '),
        emergency_contact: healthData.emergencyContact.name,
        relationship: healthData.emergencyContact.relationship,
        phone_number: healthData.emergencyContact.phone,
        additional_notes: healthData.additionalNotes
      });

      if (error) throw error;

      // Clear the form data after successful save
      setHealthData({
        bloodType: '',
        chronicDiseases: [],
        allergies: [],
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        },
        medications: [],
        height: '',
        weight: '',
        additionalNotes: ''
      });

      // Also clear any temporary input states
      setNewDisease('');
      setNewAllergy('');
      setNewMedication({ name: '', dosage: '', frequency: '' });

      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(`Failed to save health profile: ${err.message}`);
      setSuccess(false);
    }
  };

  return (
    <div className="health-profile-container">
      <div className="health-profile-card">
        <h1 className="health-profile-title">Your Health Profile</h1>
        <p className="health-profile-subtitle">
          Please provide your health information to help us deliver better care.
        </p>

        <form className="health-profile-form" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={healthData.height}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 175"
                />
              </div>
              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={healthData.weight}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 68"
                />
              </div>
            </div>
          </div>

          {/* Blood Type Section */}
          <div className="form-section">
            <h2 className="section-title">Blood Type</h2>
            <div className="form-group">
              <label htmlFor="bloodType">Select your blood type</label>
              <select
                id="bloodType"
                name="bloodType"
                value={healthData.bloodType}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="">Select blood type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chronic Diseases Section */}
          <div className="form-section">
            <h2 className="section-title">Chronic Diseases/Conditions</h2>
            <p className="section-subtitle">List any chronic diseases or health conditions you have</p>
            
            <div className="list-items">
              {healthData.chronicDiseases.map((disease, index) => (
                <div key={index} className="list-item">
                  <span>{disease}</span>
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => removeChronicDisease(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            
            <div className="add-item-control">
              <input
                type="text"
                value={newDisease}
                onChange={(e) => setNewDisease(e.target.value)}
                className="input-field"
                placeholder="e.g., Diabetes, Hypertension"
              />
              <button type="button" className="add-btn" onClick={addChronicDisease}>
                Add Condition
              </button>
            </div>
          </div>

          {/* Allergies Section */}
          <div className="form-section">
            <h2 className="section-title">Allergies</h2>
            <p className="section-subtitle">List any allergies you have (food, medication, environmental, etc.)</p>
            
            <div className="list-items">
              {healthData.allergies.map((allergy, index) => (
                <div key={index} className="list-item">
                  <span>{allergy}</span>
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => removeAllergy(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            
            <div className="add-item-control">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="input-field"
                placeholder="e.g., Penicillin, Peanuts"
              />
              <button type="button" className="add-btn" onClick={addAllergy}>
                Add Allergy
              </button>
            </div>
          </div>

          {/* Medications Section */}
          <div className="form-section">
            <h2 className="section-title">Current Medications</h2>
            <p className="section-subtitle">List medications you're currently taking</p>
            
            <div className="medication-list">
              {healthData.medications.map((med, index) => (
                <div key={index} className="medication-item">
                  <div className="medication-details">
                    <strong>{med.name}</strong> - {med.dosage} ({med.frequency})
                  </div>
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => removeMedication(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            
            <div className="add-medication-control">
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={newMedication.name}
                    onChange={handleMedicationChange}
                    className="input-field"
                    placeholder="Medication name"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="dosage"
                    value={newMedication.dosage}
                    onChange={handleMedicationChange}
                    className="input-field"
                    placeholder="Dosage (e.g., 5mg)"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="frequency"
                    value={newMedication.frequency}
                    onChange={handleMedicationChange}
                    className="input-field"
                    placeholder="Frequency (e.g., Daily)"
                  />
                </div>
              </div>
              <button type="button" className="add-btn" onClick={addMedication}>
                Add Medication
              </button>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="form-section">
            <h2 className="section-title">Emergency Contact</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactName">Name</label>
                <input
                  type="text"
                  id="contactName"
                  name="name"
                  value={healthData.emergencyContact.name}
                  onChange={handleEmergencyContactChange}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="relationship">Relationship</label>
                <input
                  type="text"
                  id="relationship"
                  name="relationship"
                  value={healthData.emergencyContact.relationship}
                  onChange={handleEmergencyContactChange}
                  className="input-field"
                  placeholder="e.g., Spouse, Parent"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="contactPhone">Phone Number</label>
              <input
                type="tel"
                id="contactPhone"
                name="phone"
                value={healthData.emergencyContact.phone}
                onChange={handleEmergencyContactChange}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="form-section">
            <h2 className="section-title">Additional Notes</h2>
            <div className="form-group">
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={healthData.additionalNotes}
                onChange={handleInputChange}
                className="input-field textarea"
                placeholder="Any other health information you'd like to share..."
                rows="4"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Save Health Profile
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">Health profile saved successfully!</p>}
      </div>
    </div>
  );
};

export default HealthProfile;