import React, { useState } from 'react';
import '../Styling/PatientDashboard.css';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sample patient data (would typically come from backend)
  const [patientData, setPatientData] = useState({
    name: 'Sarah Johnson',
    age: 42,
    bloodType: 'A+',
    allergies: ['Penicillin', 'Peanuts'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    medications: [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }
    ],
    emergencyContact: {
      name: 'Michael Johnson',
      relationship: 'Spouse',
      phone: '(555) 123-4567'
    },
    upcomingAppointments: [
      { id: 1, date: '2025-09-15', time: '10:30 AM', doctor: 'Dr. Emily Chen', type: 'Follow-up' },
      { id: 2, date: '2025-10-05', time: '2:15 PM', doctor: 'Dr. Robert Williams', type: 'Annual Checkup' }
    ],
    recentAppointments: [
      { id: 3, date: '2025-08-10', doctor: 'Dr. Emily Chen', diagnosis: 'Hypertension management' },
      { id: 4, date: '2025-07-22', doctor: 'Dr. Amanda Lee', diagnosis: 'Diabetes consultation' }
    ],
    vitals: {
      bloodPressure: '120/80 mmHg',
      heartRate: '72 bpm',
      temperature: '98.6°F',
      bloodSugar: '110 mg/dL'
    }
  });

  // Render different content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return <OverviewTab patientData={patientData} />;
      case 'health':
        return <HealthTab patientData={patientData} />;
      case 'medications':
        return <MedicationsTab patientData={patientData} />;
      default:
        return <OverviewTab patientData={patientData} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Patient Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {patientData.name}</span>
            <div className="profile-icon">
              {patientData.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar Navigation */}
        <nav className="dashboard-sidebar">
          <ul className="sidebar-nav">
            <li 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
              <span>Overview</span>
            </li>
            <li 
              className={activeTab === 'appointments' ? 'active' : ''}
              onClick={() => setActiveTab('appointments')}
            >
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 16h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"></path>
              </svg>
              <span>Appointments</span>
            </li>
            <li 
              className={activeTab === 'health' ? 'active' : ''}
              onClick={() => setActiveTab('health')}
            >
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              <span>Health Data</span>
            </li>
            <li 
              className={activeTab === 'medications' ? 'active' : ''}
              onClick={() => setActiveTab('medications')}
            >
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9"></path>
              </svg>
              <span>Medications</span>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="dashboard-main">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ patientData }) => {
  return (
    <div className="tab-content">
      <h2>Health Overview</h2>
      
      <div className="overview-grid">
        {/* Quick Stats */}
        <div className="stats-card">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{patientData.vitals.bloodPressure}</span>
              <span className="stat-label">Blood Pressure</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{patientData.vitals.heartRate}</span>
              <span className="stat-label">Heart Rate</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{patientData.vitals.bloodSugar}</span>
              <span className="stat-label">Blood Sugar</span>
            </div>
          </div>
        </div>

       

        {/* Health Summary */}
        <div className="health-summary-card">
          <h3>Health Summary</h3>
          <div className="summary-item">
            <span className="summary-label">Blood Type</span>
            <span className="summary-value">{patientData.bloodType}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Allergies</span>
            <span className="summary-value">
              {patientData.allergies.join(', ') || 'None reported'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Chronic Conditions</span>
            <span className="summary-value">
              {patientData.chronicConditions.join(', ') || 'None reported'}
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <h3>Recent Activity</h3>
          {patientData.recentAppointments.length > 0 ? (
            <ul className="activity-list">
              {patientData.recentAppointments.map(appt => (
                <li key={appt.id} className="activity-item">
                  <div className="activity-date">{new Date(appt.date).toLocaleDateString()}</div>
                  <div className="activity-details">
                    <span className="activity-title">Appointment with {appt.doctor}</span>
                    <span className="activity-desc">{appt.diagnosis}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};



const HealthTab = ({ patientData }) => {
  return (
    <div className="tab-content">
      <h2>Health Information</h2>
      
      <div className="health-grid">
        <div className="health-info-card">
          <h3>Vitals</h3>
          <div className="vitals-list">
            <div className="vital-item">
              <span className="vital-label">Blood Pressure</span>
              <span className="vital-value">{patientData.vitals.bloodPressure}</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Heart Rate</span>
              <span className="vital-value">{patientData.vitals.heartRate}</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Temperature</span>
              <span className="vital-value">{patientData.vitals.temperature}</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Blood Sugar</span>
              <span className="vital-value">{patientData.vitals.bloodSugar}</span>
            </div>
          </div>
          <button className="secondary-btn">Add New Reading</button>
        </div>
        
        <div className="health-info-card">
          <h3>Allergies</h3>
          {patientData.allergies.length > 0 ? (
            <ul className="list-items">
              {patientData.allergies.map((allergy, index) => (
                <li key={index} className="list-item">
                  <span>{allergy}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No allergies reported</p>
          )}
          <button className="secondary-btn">Update Allergies</button>
        </div>
        
        <div className="health-info-card">
          <h3>Chronic Conditions</h3>
          {patientData.chronicConditions.length > 0 ? (
            <ul className="list-items">
              {patientData.chronicConditions.map((condition, index) => (
                <li key={index} className="list-item">
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No chronic conditions reported</p>
          )}
          <button className="secondary-btn">Update Conditions</button>
        </div>
        
        <div className="health-info-card">
          <h3>Emergency Contact</h3>
          <div className="emergency-contact">
            <span className="contact-name">{patientData.emergencyContact.name}</span>
            <span className="contact-relationship">{patientData.emergencyContact.relationship}</span>
            <span className="contact-phone">{patientData.emergencyContact.phone}</span>
          </div>
          <button className="secondary-btn">Edit Contact</button>
        </div>
      </div>
    </div>
  );
};

const MedicationsTab = ({ patientData }) => {
  return (
    <div className="tab-content">
      <h2>Medications</h2>
      
      <div className="medications-header">
        <h3>Current Medications</h3>
        <button className="primary-btn">Add Medication</button>
      </div>
      
      {patientData.medications.length > 0 ? (
        <div className="medications-list">
          {patientData.medications.map((med, index) => (
            <div key={index} className="medication-card">
              <div className="medication-info">
                <span className="medication-name">{med.name}</span>
                <span className="medication-dosage">{med.dosage}</span>
                <span className="medication-frequency">{med.frequency}</span>
              </div>
              <div className="medication-actions">
                <button className="secondary-btn">Edit</button>
                <button className="text-btn">Remove</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No medications listed</p>
      )}
      
      <div className="medication-history">
        <h3>Medication History</h3>
        <p>No past medications</p>
      </div>
    </div>
  );
};

export default PatientDashboard;