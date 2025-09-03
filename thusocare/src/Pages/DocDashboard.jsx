import React, { useState } from 'react';
import '../Styling/DocDashboard.css'
import { FaBell, FaVideo, FaCalendar, FaChartBar, FaUsers, FaExclamationTriangle, FaUserFriends, FaClock, FaCog} from 'react-icons/fa';

const DocDashboard = () => {
  const urgentRequests = [
    {
      id: '1',
      patientName: 'Emma Johnson',
      age: 34,
      symptom: 'Severe chest pain, difficulty breathing',
      waitTime: '3 min',
      priority: 'critical',
    },
    {
      id: '2',
      patientName: 'Michael Chen',
      age: 67,
      symptom: 'High fever (102°F), severe headache',
      waitTime: '7 min',
      priority: 'high',
    },
    {
      id: '3',
      patientName: 'Sarah Williams',
      age: 28,
      symptom: 'Severe abdominal pain, nausea',
      waitTime: '12 min',
      priority: 'high',
    },
  ];

  const queuedPatients = [
    {
      id: '4',
      patientName: 'David Brown',
      age: 45,
      symptom: 'Follow-up cardiac consultation',
      waitTime: '5 min',
      appointmentType: 'follow-up',
    },
    {
      id: '5',
      patientName: 'Lisa Anderson',
      age: 39,
      symptom: 'Persistent cough, respiratory check',
      waitTime: '12 min',
      appointmentType: 'consultation',
    },
    {
      id: '6',
      patientName: 'James Wilson',
      age: 52,
      symptom: 'Hypertension medication review',
      waitTime: '18 min',
      appointmentType: 'follow-up',
    },
    {
      id: '7',
      patientName: 'Maria Garcia',
      age: 31,
      symptom: 'Skin condition evaluation',
      waitTime: '25 min',
      appointmentType: 'consultation',
    },
    {
      id: '8',
      patientName: 'Robert Taylor',
      age: 58,
      symptom: 'Diabetes management consultation',
      waitTime: '32 min',
      appointmentType: 'consultation',
    },
  ];

  const stats = [
    {
      title: 'Total Consultations',
      value: 24,
      change: '+12% from yesterday',
      changeType: 'positive',
    },
    {
      title: 'Video Calls Completed',
      value: 18,
      change: '+8% from yesterday',
      changeType: 'positive',
    },
    {
      title: 'Average Wait Time',
      value: '4.2 min',
      change: '-15% from yesterday',
      changeType: 'positive',
    },
    {
      title: 'Patient Satisfaction',
      value: '98%',
      change: '+2% from yesterday',
      changeType: 'positive',
    },
  ];

  


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
              <input
                type="text"
                placeholder="Search patients..."
                className="search-input"
              />
            </div>
          </div>

          <div className={`header-actions ${isMenuOpen ? 'mobile-visible' : ''}`}>
            <button className="notification-btn">
              <FaBell className="bell-icon" />
              <span className="notification-badge">3</span>
            </button>

            <div className="profile-section">
              <div className="avatar">DS</div>
              <div className="profile-info">
                <p className="doctor-name">Dr. Sarah Smith</p>
                <p className="specialty">Cardiologist</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Left Column - Urgent and Queue */}
        <div className="content-column left-column">
          {/* Urgent Requests Section */}
          <section className="urgent-section">
            <div className="section-header">
              <div className="section-title">
                <FaExclamationTriangle className="urgent-icon" />
                <h2>Urgent Requests</h2>
                <span className="urgent-badge">{urgentRequests.length} active</span>
              </div>
            </div>

            <div className="urgent-requests">
              {urgentRequests.map((request) => (
                <div key={request.id} className="urgent-card">
                  <div className="patient-info">
                    <div className="avatar">{getInitials(request.patientName)}</div>
                    <div className="patient-details">
                      <div className="patient-header">
                        <h3>{request.patientName}</h3>
                        <span className="age">({request.age} years)</span>
                        <span className={`priority-badge ${request.priority}`}>
                          {request.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="symptom-container">
                        <p className="symptom">{request.symptom}</p>
                      </div>
                      <div className="wait-time">
                        <FaClock className="clock-icon" />
                        Waiting for {request.waitTime}
                      </div>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button className="join-call-btn">
                      <FaVideo className="video-icon" />
                      Join Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Patient Queue Section */}
          <section className="queue-section">
            <div className="section-header">
              <div className="section-title">
                <FaUserFriends className="queue-icon" />
                <h2>Patient Queue</h2>
                <span className="queue-badge">{queuedPatients.length} waiting</span>
              </div>
              <button className="schedule-btn">
                <FaCalendar className="calendar-icon" />
                View Schedule
              </button>
            </div>

            <div className="patient-queue">
              {queuedPatients.map((patient, index) => (
                <div key={patient.id} className="queue-card">
                  <div className="queue-number">{index + 1}</div>
                  <div className="avatar small">{getInitials(patient.patientName)}</div>
                  <div className="patient-details">
                    <div className="patient-header">
                      <h3>{patient.patientName}</h3>
                      <span className="age">({patient.age} years)</span>
                      <span className={`appointment-badge ${patient.appointmentType}`}>
                        {patient.appointmentType}
                      </span>
                    </div>
                    <div className="symptom-container">
                      <p className="symptom">{patient.symptom}</p>
                    </div>
                    <div className="wait-time">
                      <FaClock className="clock-icon" />
                      Waiting for {patient.waitTime}
                    </div>
                  </div>
                  <div className="queue-actions">
                    <button className="call-btn">
                      <FaVideo className="video-icon" />
                      Call
                    </button>
                    <button className="details-btn">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column - Stats */}
        <div className="content-column right-column">
          {/* Today's Stats Section */}
          <section className="stats-section">
            <div className="section-header">
              <div className="section-title">
                <FaChartBar className="stats-icon" />
                <h2>Today's Statistics</h2>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.title} className="stat-card">
                  <div className="stat-content">
                    <div className="stat-info">
                      <p className="stat-title">{stat.title}</p>
                      <p className="stat-value">{stat.value}</p>
                      <p className={`stat-change ${stat.changeType}`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className="stat-icon"><FaChartBar /></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="action-card primary">
                <FaVideo className="action-icon" />
                <h3>Start Video Call</h3>
                <p>Initiate a new consultation</p>
              </div>
              <div className="action-card">
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