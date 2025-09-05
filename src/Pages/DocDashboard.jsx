import React, { useState, useEffect } from 'react';
import '../Styling/DocDashboard.css'
import { FaBell, FaVideo, FaCalendar, FaChartBar, FaUsers, FaExclamationTriangle, FaUserFriends, FaClock, FaCog } from 'react-icons/fa';
import { supabase } from '../supabase/supabaseConfig';

const DocDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState({ name: '', surname: '' });
  const [hasSearched, setHasSearched] = useState(false);
  const [showPatientRecords, setShowPatientRecords] = useState(false);
  const [allPatients, setAllPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [showEmergencies, setShowEmergencies] = useState(false);


  const searchPatients = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${term}%,surname.ilike.%${term}%,email.ilike.%${term}%`);
      
      if (error) throw error;
      
      const usersWithInfo = await Promise.all(
        (data || []).map(async (user) => {
          if (!user.id) return { ...user, info: [] };
          
          const { data: infoData } = await supabase
            .from('info')
            .select('*')
            .eq('user_id', user.id);
          
          return {
            ...user,
            info: infoData || []
          };
        })
      );
      
      setSearchResults(usersWithInfo);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleSearchClick = () => {
    searchPatients(searchTerm);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setSearchResults([]);
    setShowPatientRecords(false);
  };

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const loggedInDoctor = localStorage.getItem('loggedInDoctor');
        if (loggedInDoctor) {
          const doctorData = JSON.parse(loggedInDoctor);
          setDoctorInfo(doctorData);
          return;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: medicData, error } = await supabase
            .from('medics')
            .select('name, surname, email')
            .eq('email', user.email);
          
          if (medicData && medicData.length > 0 && !error) {
            setDoctorInfo(medicData[0]);
            localStorage.setItem('loggedInDoctor', JSON.stringify(medicData[0]));
          }
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error);
      }
    };
    
    const checkActiveCall = () => {
      const callData = localStorage.getItem('activeCall');
      if (callData) {
        setActiveCall(JSON.parse(callData));
      }
    };

    const checkIncomingCalls = async () => {
      try {
        console.log('Checking for incoming calls...');
        
        // First, check all video calls to see what's in the database
        const { data: allCalls, error: allCallsError } = await supabase
          .from('video_calls')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log('All video calls in database:', { allCalls, allCallsError });
        
        const { data: callData, error: callError } = await supabase
          .from('video_calls')
          .select('*')
          .eq('call_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);
        
        console.log('Pending calls query result:', { callData, callError });
        
        if (callError) throw callError;
        
        if (callData && callData.length > 0) {
          const call = callData[0];
          console.log('Found pending call:', call);
          
          // Handle anonymous calls (caller_id is null)
          if (!call.caller_id) {
            console.log('Found anonymous call');
            const anonymousCall = {
              roomId: call.room_id,
              name: 'Anonymous',
              surname: 'User',
              email: 'No email provided',
              timestamp: call.created_at,
              callId: call.id
            };
            console.log('Setting anonymous call:', anonymousCall);
            setActiveCall(anonymousCall);
            return;
          }
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, surname, email')
            .eq('user_id', call.caller_id)
            .single();
          
          console.log('User data result:', { userData, userError });
          
          if (userError) {
            console.error('Error fetching user data:', userError);
            // Fallback for unknown user
            setActiveCall({
              roomId: call.room_id,
              name: 'Unknown',
              surname: 'User',
              email: 'No email available',
              timestamp: call.created_at,
              callId: call.id
            });
            return;
          }
          
          setActiveCall({
            roomId: call.room_id,
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
            timestamp: call.created_at,
            callId: call.id
          });
        } else {
          console.log('No pending calls found');
        }
      } catch (error) {
        console.error('Error checking incoming calls:', error);
      }
    };
    
    fetchDoctorInfo();
    checkActiveCall();
    checkIncomingCalls();
    
    // Poll for active calls every 2 seconds
    const interval = setInterval(() => {
      checkActiveCall();
      checkIncomingCalls();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllPatients = async () => {
    setLoadingPatients(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      
      const usersWithInfo = await Promise.all(
        (data || []).map(async (user) => {
          if (!user.user_id) return { ...user, info: [] };
          
          const { data: infoData } = await supabase
            .from('info')
            .select('*')
            .eq('user_id', user.user_id);
          
          return {
            ...user,
            info: infoData || []
          };
        })
      );
      
      setAllPatients(usersWithInfo);
      setShowPatientRecords(true);
    } catch (error) {
      console.error('Error fetching all patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('loggedInDoctor');
    window.location.href = '/landing';
  };

  const joinVideoCall = () => {
    const roomId = crypto.randomUUID();
    window.open(`/video-call/${roomId}`, '_blank');
  };

  const fetchEmergencies = async () => {
    try {
      console.log('Fetching from emergencies table...');
      
      // Check doctor info from localStorage
      const doctorInfo = localStorage.getItem('loggedInDoctor');
      console.log('Doctor info:', doctorInfo);
      
      if (!doctorInfo) {
        alert('Please log in as a doctor to view emergencies');
        return;
      }
      
      const { data, error } = await supabase
        .from('emergencies')
        .select(`
          *,
          users!inner(
            name,
            surname,
            email
          )
        `);
      
      console.log('Raw query result:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        alert(`Error fetching emergencies: ${error.message}`);
        return;
      }
      
      console.log('Emergencies data:', data);
      console.log('Number of emergencies:', data?.length || 0);
      setEmergencies(data || []);
      setShowEmergencies(true);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      alert(`Failed to fetch emergencies: ${error.message}`);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <div className="title-section">
              <h1>ThusoCare</h1>
              <p>Doctor Dashboard</p>
            </div>
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              ☰
            </button>
          </div>

          <div className={`search-section ${isMenuOpen ? 'mobile-visible' : ''}`}>
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="search-input"
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
                />
                <button className="search-icon-btn" onClick={handleSearchClick}>
                  <img src={require('../images/search.png')} alt="Search" className="search-icon" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((patient, index) => (
                    <div 
                      key={patient.id || patient.user_id || `search-${index}`} 
                      className="search-result-item"
                      onClick={() => selectPatient(patient)}
                    >
                      <strong>{patient.name} {patient.surname}</strong>
                      <span>{patient.email}</span>
                    </div>
                  ))}
                </div>
              )}
              {hasSearched && searchResults.length === 0 && !isSearching && searchTerm.trim() && (
                <div className="no-results">
                  <p>No patients found for "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>

          <div className={`header-actions ${isMenuOpen ? 'mobile-visible' : ''}`}>
            

            <div className="profile-section">
              <div className="avatar">
                {getInitials(`${doctorInfo.name} ${doctorInfo.surname}`)}
              </div>
              <div className="profile-info">
                <p className="doctor-name">{doctorInfo.name} {doctorInfo.surname}</p>
                <p className="specialty">Medical Professional</p>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        <div className="content-column left-column">
          {showEmergencies ? (
            <section className="emergency-alerts-section">
              <div className="section-header">
                <div className="section-title">
                  <FaExclamationTriangle className="emergency-icon" />
                  <h2>Emergency Alerts</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setShowEmergencies(false)}
                  >
                    <img src={require('../images/cross.png')} alt="Close" />
                  </button>
                </div>
              </div>

              <div className="emergencies-list">
                {emergencies.length === 0 ? (
                  <div className="no-emergencies">
                    <p>No emergency alerts at this time.</p>
                  </div>
                ) : (
                  emergencies.map((emergency, index) => (
                    <div key={emergency.id || `emergency-${index}`} style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '20px',
                      boxShadow: '0 8px 32px rgba(244, 67, 54, 0.15)',
                      border: '2px solid #ffebee',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: '#ffebee',
                          padding: '8px 16px',
                          borderRadius: '25px',
                          border: '1px solid #f44336'
                        }}>
                          <FaExclamationTriangle style={{ color: '#f44336', fontSize: '18px' }} />
                          <span style={{ color: '#c62828', fontWeight: '700', fontSize: '14px' }}>EMERGENCY ALERT</span>
                        </div>
                        <div style={{
                          color: '#666',
                          fontSize: '13px',
                          backgroundColor: '#f5f5f5',
                          padding: '6px 12px',
                          borderRadius: '12px'
                        }}>Reported at:
                         
                          {new Date(emergency.time_recorded).toLocaleString()}
                        </div>
                      </div>
                      
                      <div 
                        style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '20px',
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}>
                        <div 
                          onClick={() => {
                            alert('Avatar clicked!');
                            setSelectedPatient({
                              ...emergency.users,
                              id: emergency.user_id,
                              user_id: emergency.user_id,
                              info: []
                            });
                          }}
                          style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          cursor: 'pointer'
                        }}>
                          {getInitials(`${emergency.users.name} ${emergency.users.surname}`)}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1f2937' }}>
                            {emergency.users.name} {emergency.users.surname}
                          </h4>
                          <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                            {emergency.users.email}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: '#fff7ed',
                        borderRadius: '12px',
                        border: '1px solid #fed7aa'
                      }}>
                        <h5 style={{ margin: '0 0 12px 0', color: '#ea580c', fontSize: '16px', fontWeight: '600' }}>
                          Emergency Description:
                        </h5>
                        <p style={{ margin: '0', color: '#1f2937', fontSize: '15px', lineHeight: '1.6' }}>
                          {emergency.emergency}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => {
                            window.open(`https://mail.google.com/mail/?view=cm&to=${emergency.users.email}`, '_blank');
                          }}
                          style={{
                          backgroundColor: '#fefefeff',
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          padding: '12px 24px',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#ffffffff'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ffffffff'}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                          </svg>
                          Contact Patient
                        </button>
                        
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : showPatientRecords ? (
            <section className="patient-records-section">
              <div className="section-header">
                <div className="section-title">
                  <FaUsers className="patient-icon" />
                  <h2>All Patient Records</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setShowPatientRecords(false)}
                  >
                    <img src={require('../images/cross.png')} alt="Close" />
                  </button>
                </div>
              </div>

              {loadingPatients ? (
                <div className="loading-state">
                  <p>Loading patient records...</p>
                </div>
              ) : (
                <div className="patients-grid">
                  {allPatients.map((patient, index) => (
                    <div key={patient.id || patient.user_id || `patient-${index}`} className="patient-record-card" onClick={() => selectPatient(patient)}>
                      <div className="patient-header">
                        <div className="avatar">
                          {getInitials(`${patient.name} ${patient.surname}`)}
                        </div>
                        <div className="patient-basic-info">
                          <h4>{patient.name} {patient.surname}</h4>
                          <p>Age: {patient.age} years</p>
                          <p>Gender: {patient.gender}</p>
                          <p>Email: {patient.email}</p>
                          <p>Phone: {patient.phone}</p>
                        </div>
                      </div>

                      {patient.info && patient.info.length > 0 && (
                        <div className="medical-summary">
                          <h5>Medical Info</h5>
                          {patient.info.map((info, infoIndex) => (
                            <div key={info.id || info.created_at || `${patient.id}-info-${infoIndex}`} className="info-summary">
                              <span>Blood Type: {info.blood_type || 'N/A'}</span>
                              <span>Allergies: {info.allergies || 'None'}</span>
                              <span>Chronic: {info.chronic_disease || 'None'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : selectedPatient ? (
            <section className="patient-details-section">
              <div className="section-header">
                <div className="section-title">
                  <FaUsers className="patient-icon" />
                  <h2>Patient Details</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setSelectedPatient(null)}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="patient-profile">
                <div className="patient-header">
                  <div className="avatar large">
                    {getInitials(`${selectedPatient.name} ${selectedPatient.surname}`)}
                  </div>
                  <div className="patient-basic-info">
                    <h3>{selectedPatient.name} {selectedPatient.surname}</h3>
                    <p>Age: {selectedPatient.age} years</p>
                    <p>Gender: {selectedPatient.gender}</p>
                    <p>Email: {selectedPatient.email}</p>
                    <p>Phone: {selectedPatient.phone}</p>
                  </div>
                </div>

                {selectedPatient.info && selectedPatient.info.length > 0 ? (
                  <div className="medical-info">
                    <h4><img src={require('../images/info.png')} alt="Medical Info" style={{width: '20px', height: '20px', marginRight: '8px'}} />Medical Information</h4>
                    {selectedPatient.info.map((info, infoIndex) => (
                      <div key={info.id || info.created_at || `${selectedPatient.user_id || selectedPatient.id}-info-${infoIndex}`} style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}><img src={require('../images/stethoscope.png')} alt="Vital Signs" style={{width: '18px', height: '18px', marginRight: '8px'}} />Vital Signs</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Height</div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>{info.height || 'N/A'}</div>
                            </div>
                            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Weight</div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>{info.weight || 'N/A'}</div>
                            </div>
                            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Blood Type</div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc3545' }}>{info.blood_type || 'N/A'}</div>
                            </div>
                            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Blood Pressure</div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>{info.blood_pressure || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}><img src={require('../images/hospital.png')} alt="Medical Conditions" style={{width: '18px', height: '18px', marginRight: '8px'}} />Medical Conditions</h5>
                          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#495057' }}>Chronic Diseases:</strong> 
                              <span style={{ marginLeft: '8px', color: '#6c757d' }}>{info.chronic_disease || 'None reported'}</span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#495057' }}>Allergies:</strong> 
                              <span style={{ marginLeft: '8px', color: '#6c757d' }}>{info.allergies || 'None reported'}</span>
                            </div>
                            <div>
                              <strong style={{ color: '#495057' }}>Current Medications:</strong> 
                              <span style={{ marginLeft: '8px', color: '#6c757d' }}>{info.current_medications || 'None reported'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {(info.insurance_provider || info.insurance_number) && (
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}><img src={require('../images/info.png')} alt="Insurance" style={{width: '18px', height: '18px', marginRight: '8px'}} />Insurance</h5>
                            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                              <div><strong>Provider:</strong> {info.insurance_provider || 'Not provided'}</div>
                              <div><strong>Policy:</strong> {info.insurance_number || 'Not provided'}</div>
                            </div>
                          </div>
                        )}
                        
                        {info.emergency_contact && (
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}><img src={require('../images/emergency.png')} alt="Emergency Contact" style={{width: '18px', height: '18px', marginRight: '8px'}} />Emergency Contact</h5>
                            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                              <strong>{info.emergency_contact}</strong>
                              {info.relationship && <span style={{ color: '#6c757d' }}> ({info.relationship})</span>}
                            </div>
                          </div>
                        )}
                        
                        {info.additional_notes && (
                          <div>
                            <h5 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}><img src={require('../images/notes.png')} alt="Notes" style={{width: '18px', height: '18px', marginRight: '8px'}} />Notes</h5>
                            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6', fontStyle: 'italic', color: '#6c757d' }}>
                              {info.additional_notes}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                    <p><img src={require('../images/info.png')} alt="No Info" style={{width: '20px', height: '20px', marginRight: '8px'}} />No medical information available for this patient.</p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="search-prompt">
              <div className="search-prompt-content">
                <FaUsers className="search-icon" />
                <h3>Search for a Patient</h3>
                <p>Use the search bar above to find patient information</p>
              </div>
            </section>
          )}
        </div>

        <div className="content-column right-column">
          {activeCall && (
            <section className="active-call-section">
              <div className="section-header">
                <div className="section-title">
                  <FaVideo className="call-icon" />
                  <h2>Incoming Call</h2>
                </div>
              </div>
              <div className="call-notification">
                <div className="caller-info">
                  <div className="avatar">
                    {getInitials(`${activeCall.name} ${activeCall.surname}`)}
                  </div>
                  <div className="caller-details">
                    <h3>{activeCall.name} {activeCall.surname}</h3>
                    <p>{activeCall.email}</p>
                    <small>Calling since {new Date(activeCall.timestamp).toLocaleTimeString()}</small>
                  </div>
                </div>
                <div className="call-actions">
                  <button 
                    className="answer-btn"
                    onClick={async () => {
                      try {
                        await supabase
                          .from('video_calls')
                          .update({ call_status: 'active' })
                          .eq('id', activeCall.callId);
                        window.open(`/video-call/${activeCall.roomId}`, '_blank');
                      } catch (error) {
                        console.error('Error updating call status:', error);
                      }
                      localStorage.removeItem('activeCall');
                      setActiveCall(null);
                    }}
                  >
                    <FaVideo /> Answer Call
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={async () => {
                      try {
                        await supabase
                          .from('video_calls')
                          .update({ call_status: 'declined' })
                          .eq('id', activeCall.callId);
                      } catch (error) {
                        console.error('Error updating call status:', error);
                      }
                      localStorage.removeItem('activeCall');
                      setActiveCall(null);
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </section>
          )}
          
          <section className="actions-section">
            <div className="section-header">
              <div className="section-title">
                <FaChartBar className="stats-icon" />
                <h2>Quick Actions</h2>
              </div>
            </div>

            <div className="quick-actions">
              <div className="action-card primary" onClick={joinVideoCall}>
                <FaVideo className="action-icon" />
                <h3>Join Video Call</h3>
                <p>Start a video consultation</p>
              </div>
              <div className="action-card" onClick={fetchAllPatients}>
                <FaUserFriends className="action-icon" />
                <h3>Patient Records</h3>
                <p>Access patient history</p>
              </div>
              <div className="action-card" onClick={fetchEmergencies}>
                <FaExclamationTriangle className="action-icon" />
                <h3>Emergency Alerts</h3>
                <p>Monitor critical cases</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DocDashboard;