import React, { useState, useEffect } from 'react';
import '../Styling/DocDashboard.css'
import { FaBell, FaVideo, FaCalendar, FaChartBar, FaUsers, FaExclamationTriangle, FaUserFriends, FaClock, FaCog } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

// Create a single supabase instance
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const DocDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState({ name: '', surname: '' });
  const [hasSearched, setHasSearched] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCallListening, setIsCallListening] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null);
  const [pendingCalls, setPendingCalls] = useState([]);
  const [showPatientRecords, setShowPatientRecords] = useState(false);
  const [allPatients, setAllPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const searchPatients = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    console.log('Searching for:', term);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${term}%,surname.ilike.%${term}%,email.ilike.%${term}%`);
      
      if (error) throw error;
      
      // Fetch info for each user
      const usersWithInfo = await Promise.all(
        (data || []).map(async (user) => {
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
      
      console.log('Search results:', usersWithInfo);
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
  };

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const fetchDoctorInfo = async () => {
      try {
        // First try to get from localStorage
        const loggedInDoctor = localStorage.getItem('loggedInDoctor');
        if (loggedInDoctor) {
          const doctorData = JSON.parse(loggedInDoctor);
          setDoctorInfo(doctorData);
          console.log('Doctor info from localStorage:', doctorData);
          
          // Start listening for incoming calls and fetch pending calls
          listenForIncomingCalls(doctorData.email);
          fetchPendingCalls(doctorData.email);
          return;
        }
        
        // Fallback: get current authenticated user and match with medics table
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: medicData, error } = await supabase
            .from('medics')
            .select('name, surname, email')
            .eq('email', user.email)
            .single();
          
          if (medicData && !error) {
            setDoctorInfo(medicData);
            // Store for future use
            localStorage.setItem('loggedInDoctor', JSON.stringify(medicData));
            
            // Start listening for incoming calls and fetch pending calls
            listenForIncomingCalls(medicData.email);
            fetchPendingCalls(medicData.email);
          }
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error);
      }
    };
    
    fetchDoctorInfo();
  }, []);

  const fetchPendingCalls = async (doctorEmail) => {
    try {
      const { data: medicData, error: medicError } = await supabase
        .from('medics')
        .select('id')
        .eq('email', doctorEmail)
        .single();
      
      if (medicError || !medicData) return;
      
      const { data: calls, error } = await supabase
        .from('video_calls')
        .select(`
          *,
          users!video_calls_caller_id_fkey(name, surname, email)
        `)
        .eq('receiver_id', medicData.id)
        .eq('call_status', 'pending')
        .order('created_at', { ascending: true });
      
      if (!error && calls) {
        setPendingCalls(calls);
      }
    } catch (error) {
      console.error('Error fetching pending calls:', error);
    }
  };

  const listenForIncomingCalls = async (doctorEmail) => {
    if (isCallListening) return;
    setIsCallListening(true);
    
    try {
      // Get medic's id from medics table
      const { data: medicData, error: medicError } = await supabase
        .from('medics')
        .select('id')
        .eq('email', doctorEmail)
        .single();
      
      if (medicError || !medicData) {
        console.error('Error getting medic id:', medicError);
        return;
      }
      
      console.log('Listening for calls for medic id:', medicData.id);
      
      // Listen for new video calls where this medic is the receiver
      const subscription = supabase
        .channel(`video-calls-${medicData.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'video_calls',
          filter: `receiver_id=eq.${medicData.id}`
        }, async (payload) => {
          console.log('Incoming call:', payload.new);
          
          // Get caller information
          const { data: caller, error: callerError } = await supabase
            .from('users')
            .select('name, surname, email')
            .eq('id', payload.new.caller_id)
            .single();
          
          if (!callerError && caller) {
            setCallerInfo(caller);
          }
          
          // Add to pending calls list
          const newCall = {
            ...payload.new,
            users: caller
          };
          setPendingCalls(prev => [...prev, newCall]);
          
          setIncomingCall(payload.new);
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming Video Call', {
              body: `${caller?.name || 'A patient'} is calling you`,
              icon: '/favicon.ico'
            });
          }
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
      
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up call listener:', error);
    }
  };

  const answerCall = async (callId) => {
    try {
      // Update call status to active
      await supabase
        .from('video_calls')
        .update({ call_status: 'active', started_at: new Date().toISOString() })
        .eq('id', callId);
      
      window.open(`/video-call/${callId}`, '_blank');
      setIncomingCall(null);
      setCallerInfo(null);
      setPendingCalls(prev => prev.filter(call => call.id !== callId));
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };

  const declineCall = async (callId) => {
    try {
      await supabase
        .from('video_calls')
        .update({ call_status: 'declined', ended_at: new Date().toISOString() })
        .eq('id', callId);
      setIncomingCall(null);
      setCallerInfo(null);
      setPendingCalls(prev => prev.filter(call => call.id !== callId));
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };
  const fetchAllPatients = async () => {
    console.log('fetchAllPatients called');
    setLoadingPatients(true);
    try {
      console.log('Fetching patients from database...');
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      
      // Fetch info for each user separately
      const usersWithInfo = await Promise.all(
        (data || []).map(async (user) => {
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
      
      console.log('Database response:', { data: usersWithInfo });
      setAllPatients(usersWithInfo);
      setShowPatientRecords(true);
      console.log('Patient records view should now be visible');
    } catch (error) {
      console.error('Error fetching all patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="dashboard">
      {/* Header */}
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
                  {searchResults.map((patient) => (
                    <div 
                      key={patient.id} 
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
            <button className="notification-btn">
              <FaBell className="bell-icon" />
              
            </button>

            <div className="profile-section">
              <div className="avatar">
                {getInitials(`${doctorInfo.name} ${doctorInfo.surname}`)}
              </div>
              <div className="profile-info">
                <p className="doctor-name">{doctorInfo.name} {doctorInfo.surname}</p>
                <p className="specialty">Medical Professional</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-modal">
            <div className="call-icon">
              <FaVideo size={40} color="#3b82f6" />
            </div>
            <h3>Incoming Video Call</h3>
            <p>{callerInfo ? `${callerInfo.name} ${callerInfo.surname}` : 'A patient'} is requesting a video consultation</p>
            {callerInfo && (
              <div className="caller-details">
                <small>{callerInfo.email}</small>
              </div>
            )}
            <div className="call-actions">
              <button 
                className="answer-btn"
                onClick={() => answerCall(incomingCall.id)}
              >
                <FaVideo /> Answer
              </button>
              <button 
                className="decline-btn"
                onClick={() => declineCall(incomingCall.id)}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-container">
        {/* Left Column - Patient Details or Search */}
        <div className="content-column left-column">
          {/* Waiting Room Section */}
          {pendingCalls.length > 0 && (
            <section className="waiting-room-section">
              <div className="section-header">
                <div className="section-title">
                  <FaClock className="clock-icon" />
                  <h2>Waiting Room</h2>
                  <span className="queue-badge">{pendingCalls.length}</span>
                </div>
              </div>
              <div className="waiting-room-list">
                {pendingCalls.map((call) => (
                  <div key={call.id} className="waiting-room-card">
                    <div className="patient-info">
                      <div className="avatar">
                        {call.users ? getInitials(`${call.users.name} ${call.users.surname}`) : 'P'}
                      </div>
                      <div className="patient-details">
                        <h4>{call.users ? `${call.users.name} ${call.users.surname}` : 'Patient'}</h4>
                        <p>{call.users?.email}</p>
                        <small>Waiting since {new Date(call.created_at).toLocaleTimeString()}</small>
                      </div>
                    </div>
                    <button 
                      className="answer-call-btn"
                      onClick={() => answerCall(call.id)}
                    >
                      <FaVideo /> Answer
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {showPatientRecords ? (
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
                  {allPatients.map((patient) => (
                    <div key={patient.id} className="patient-record-card" onClick={() => selectPatient(patient)}>
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
                          {patient.info.map((info) => (
                            <div key={info.id || info.created_at || `${patient.id}-info`} className="info-summary">
                              <span key={`${info.id || patient.id}-blood`}>Blood Type: {info.blood_type || 'N/A'}</span>
                              <span key={`${info.id || patient.id}-allergies`}>Allergies: {info.allergies || 'None'}</span>
                              <span key={`${info.id || patient.id}-chronic`}>Chronic: {info.chronic_disease || 'None'}</span>
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

                {selectedPatient.info && selectedPatient.info.length > 0 && (
                  <div className="medical-info">
                    <h4>Medical Information</h4>
                    {selectedPatient.info.map((info) => (
                      <div key={info.id || info.created_at || `${selectedPatient.id}-info`} className="info-grid">
                        <div className="info-item">
                          <label>Height:</label>
                          <span>{info.height || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Weight:</label>
                          <span>{info.weight || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Blood Type:</label>
                          <span>{info.blood_type || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Blood Pressure:</label>
                          <span>{info.blood_pressure || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Heart Rate:</label>
                          <span>{info.heart_rate || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Temperature:</label>
                          <span>{info.temperature || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Chronic Diseases:</label>
                          <span>{info.chronic_disease || 'None reported'}</span>
                        </div>
                        <div className="info-item">
                          <label>Allergies:</label>
                          <span>{info.allergies || 'None reported'}</span>
                        </div>
                        <div className="info-item">
                          <label>Current Medications:</label>
                          <span>{info.current_medications || 'None reported'}</span>
                        </div>
                        <div className="info-item">
                          <label>Medical History:</label>
                          <span>{info.medical_history || 'No history provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Insurance Provider:</label>
                          <span>{info.insurance_provider || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Insurance Number:</label>
                          <span>{info.insurance_number || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Emergency Contact:</label>
                          <span>{info.emergency_contact || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Relationship:</label>
                          <span>{info.relationship || 'Not provided'}</span>
                        </div>
                        <div className="info-item full-width">
                          <label>Additional Notes:</label>
                          <span>{info.additional_notes || 'No additional notes'}</span>
                        </div>
                      </div>
                    ))}
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

        {/* Right Column - Quick Actions */}
        <div className="content-column right-column">
          <section className="actions-section">
            <div className="section-header">
              <div className="section-title">
                <FaChartBar className="stats-icon" />
                <h2>Quick Actions</h2>
              </div>
            </div>

            <div className="quick-actions">
              <div className="action-card primary">
                <FaVideo className="action-icon" />
                <h3>Start Video Call</h3>
                <p>Initiate a new consultation</p>
              </div>
              <div className="action-card" onClick={() => {
                console.log('Patient Records clicked');
                fetchAllPatients();
              }}>
                <FaUserFriends className="action-icon" />
                <h3>Patient Records</h3>
                <p>Access patient history</p>
              </div>
              <div className="action-card">
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