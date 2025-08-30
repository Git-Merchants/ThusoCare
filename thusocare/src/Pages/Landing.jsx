import React from 'react';
import '../Styling/LandingPage.css'; // Import the CSS file forLandingPage.css';

const LandingPage = () => {
    // Function for smooth scrolling to sections
    const scrollToSection = (id) => {
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    };

    const handleNavigation = (path) => {
    window.location.href = path;
  };

    return (
        <div className="landing-container">
            {/* Navigation Bar */}
            <nav className="navbar">
                <div className="navbar-content">
                    <div className="logo">ThusoCare</div>
                    <div className="nav-links">
                        {/* Inner links for sections */}
                        <a onClick={() => scrollToSection('features')} className="nav-link hidden-sm">Features</a>
                        <a onClick={() => scrollToSection('about')} className="nav-link hidden-sm">About</a>
                        {/* Login and Sign Up buttons */}
                        <button href="/login" className="signup-btn" onClick={() => handleNavigation('login')}>Login</button>
                        <button href="/signup" className="signup-btn" onClick={() => handleNavigation('signup')}>Sign Up</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Your Health, Simplified.</h1>
                    <p className="hero-subtitle">
                        Manage appointments, track vitals, and connect with doctors, all in one place.
                    </p>
                    <button className="get-started-btn" onClick={() => handleNavigation('signup')}>
                        Get Started
                    </button>
                </div>
                <div className="hero-image">
                    <img src="./images/doctor.jpg" alt="Healthcare Illustration" />
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-content">
                    <h2 className="section-title">
                        Powerful Features at Your Fingertips
                    </h2>
                    <div className="features-grid">
                        {/* Feature Card 1 */}
                        <div className="feature-card">
                            <div className="feature-icon bg-blue-100">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 16h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <h3 className="card-title">Appointment Scheduling</h3>
                            <p className="card-text">Easily book, reschedule, or cancel appointments with your healthcare providers online.</p>
                        </div>
                        {/* Feature Card 2 */}
                        <div className="feature-card">
                            <div className="feature-icon bg-green-100">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h2m-2 4h2m2-4h2m-2 4h2m-10-4h2m-2 4h2m-2 4h2"></path>
                                </svg>
                            </div>
                            <h3 className="card-title">Personal Health Records</h3>
                            <p className="card-text">Access and manage your medical history, lab results, and immunization records securely.</p>
                        </div>
                        {/* Feature Card 3 */}
                        <div className="feature-card">
                            <div className="feature-icon bg-purple-100">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 className="card-title">Medication Reminders</h3>
                            <p className="card-text">Receive timely reminders to take your medications and track your adherence.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="section-content about-content">
                    <h2 className="section-title">Our Mission</h2>
                    <p className="about-text">
                        At ThusoCare, we are dedicated to empowering individuals to take control of their health by providing a seamless and secure digital platform. Our goal is to make healthcare accessible, efficient, and transparent for everyone.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <p>&copy; 2025 ThusoCare. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
