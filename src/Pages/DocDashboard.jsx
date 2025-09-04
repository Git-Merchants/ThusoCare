import React, { useState, useEffect } from 'react';
import '../Styling/DocDashboard.css'
import { FaBell, FaVideo, FaCalendar, FaChartBar, FaUsers, FaExclamationTriangle, FaUserFriends, FaClock, FaCog } from 'react-icons/fa';

const supabase = window.supabaseClient;

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
    
    fetchDoctorInfo();
    checkActiveCall();
    
    // Poll for active calls every 2 seconds
    const interval = setInterval(checkActiveCall, 2000);
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
                    onClick={() => {
                      window.open(`/video-call/${activeCall.roomId}`, '_blank');
                      localStorage.removeItem('activeCall');
                      setActiveCall(null);
                    }}
                  >
                    <FaVideo /> Answer Call
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={() => {
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