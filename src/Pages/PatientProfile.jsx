import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../Styling/PatientDashboard.css';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PatientDashboard = () => {
    // 1. Remove 'appointments' from the initial state and rendering logic
    const [activeTab, setActiveTab] = useState('overview');
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect hook to fetch data on component mount
    useEffect(() => {
        const fetchPatientData = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setError('User is not authenticated.');
                    setLoading(false);
                    return;
                }

                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('name, surname')
                    .eq('user_id', user.id)
                    .single();

                if (userError) {
                    throw userError;
                }

                const { data: infoData, error: infoError } = await supabase
                    .from('info')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (infoError) {
                    throw infoError;
                }

                const combinedData = {
                    ...userData,
                    ...infoData,
                };

                setPatientData(combinedData);

            } catch (err) {
                console.error('Error fetching data:', err);
                setError(`Failed to fetch patient data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, []);

    if (loading) {
        return <div className="loading-state">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    if (!patientData || !patientData.name) {
        return <div className="error-state">No patient data available. Please ensure your profile is complete.</div>;
    }

    // 2. Remove the 'appointments' case from the switch statement
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
                            {patientData.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Sidebar Navigation */}
                <nav className="dashboard-sidebar">
                    <ul className="sidebar-nav">
                        {/* 3. Remove the 'appointments' list item */}
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

// You can also remove the AppointmentsTab component if it was defined separately.
// The remaining components are kept as-is.

const OverviewTab = ({ patientData }) => {
    const vitals = patientData.vitals || {};
    const allergies = patientData.allergies || [];
    const chronicConditions = patientData.chronicConditions || [];
    const recentAppointments = patientData.recentAppointments || [];
    return (
        <div className="tab-content">
            <h2>Health Overview</h2>
            
            <div className="overview-grid">
                <div className="stats-card">
                    <h3>Quick Stats</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-value">{vitals.bloodPressure || 'N/A'}</span>
                            <span className="stat-label">Blood Pressure</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{vitals.heartRate || 'N/A'}</span>
                            <span className="stat-label">Heart Rate</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{vitals.bloodSugar || 'N/A'}</span>
                            <span className="stat-label">Blood Sugar</span>
                        </div>
                    </div>
                </div>

                <div className="health-summary-card">
                    <h3>Health Summary</h3>
                    <div className="summary-item">
                        <span className="summary-label">Blood Type</span>
                        <span className="summary-value">{patientData.bloodType || 'N/A'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Allergies</span>
                        <span className="summary-value">
                            {allergies.join(', ') || 'None reported'}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Chronic Conditions</span>
                        <span className="summary-value">
                            {chronicConditions.join(', ') || 'None reported'}
                        </span>
                    </div>
                </div>

                <div className="activity-card">
                    <h3>Recent Activity</h3>
                    {recentAppointments.length > 0 ? (
                        <ul className="activity-list">
                            {recentAppointments.map(appt => (
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
    const vitals = patientData.vitals || {};
    const allergies = patientData.allergies || [];
    const chronicConditions = patientData.chronicConditions || [];
    const emergencyContact = patientData.emergencyContact || {};

    return (
        <div className="tab-content">
            <h2>Health Information</h2>
            
            <div className="health-grid">
                <div className="health-info-card">
                    <h3>Vitals</h3>
                    <div className="vitals-list">
                        <div className="vital-item">
                            <span className="vital-label">Blood Pressure</span>
                            <span className="vital-value">{vitals.bloodPressure || 'N/A'}</span>
                        </div>
                        <div className="vital-item">
                            <span className="vital-label">Heart Rate</span>
                            <span className="vital-value">{vitals.heartRate || 'N/A'}</span>
                        </div>
                        <div className="vital-item">
                            <span className="vital-label">Temperature</span>
                            <span className="vital-value">{vitals.temperature || 'N/A'}</span>
                        </div>
                        <div className="vital-item">
                            <span className="vital-label">Blood Sugar</span>
                            <span className="vital-value">{vitals.bloodSugar || 'N/A'}</span>
                        </div>
                    </div>
                    <button className="secondary-btn">Add New Reading</button>
                </div>
                
                <div className="health-info-card">
                    <h3>Allergies</h3>
                    {allergies.length > 0 ? (
                        <ul className="list-items">
                            {allergies.map((allergy, index) => (
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
                    {chronicConditions.length > 0 ? (
                        <ul className="list-items">
                            {chronicConditions.map((condition, index) => (
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
                        <span className="contact-name">{emergencyContact.name || 'N/A'}</span>
                        <span className="contact-relationship">{emergencyContact.relationship || 'N/A'}</span>
                        <span className="contact-phone">{emergencyContact.phone || 'N/A'}</span>
                    </div>
                    <button className="secondary-btn">Edit Contact</button>
                </div>
            </div>
        </div>
    );
};

const MedicationsTab = ({ patientData }) => {
    const medications = patientData.medications || [];

    return (
        <div className="tab-content">
            <h2>Medications</h2>
            
            <div className="medications-header">
                <h3>Current Medications</h3>
                <button className="primary-btn">Add Medication</button>
            </div>
            
            {medications.length > 0 ? (
                <div className="medications-list">
                    {medications.map((med, index) => (
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