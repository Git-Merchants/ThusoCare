import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate,Link } from 'react-router-dom';

import CallIcon from '../images/call.png';
import { useAuth } from '../context/AuthContext';
import { createVideoCall } from '../services/videoCallService';
import VideoCallButton from '../components/VideoCallButton';
import '../Styling/Home.css';
import '../Styling/VideoCallButton.css';


const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showLanguages, setShowLanguages] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
   


    // Handle OAuth callback
    useEffect(() => {
        const handleAuthCallback = async () => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            
            if (accessToken) {
                console.log('Processing OAuth callback...');
                try {
                    const { data, error } = await supabase.auth.getUser(accessToken);
                    if (error) throw error;
                    
                    // Clear the hash from URL
                    window.history.replaceState(null, null, window.location.pathname);
                    console.log('OAuth login successful');
                } catch (error) {
                    console.error('OAuth callback error:', error);
                }
            }
        };
        
        handleAuthCallback();
    }, []);

    // Debug: Log user data when it changes
    useEffect(() => {
        if (user) {
            console.log('User data in Home component:', {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
                app_metadata: user.app_metadata
            });
        }
    }, [user]);

    // Use existing global supabase client
    const supabase = window.supabaseClient;
    

    // Custom icons
    const hospitalIcon = new Icon({
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    const clinicIcon = new Icon({
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    const userIcon = new Icon({
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
        if (!user || !isMounted) return;
        setIsLoadingProfile(true);

        try {
            // First try to get user data from user_metadata (this is what Supabase Auth provides)
            if (user.user_metadata) {
                const profileData = {
                    name: user.user_metadata.name || user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
                    surname: user.user_metadata.surname || user.user_metadata.last_name || ''
                };
                
                console.log('Using user metadata for profile:', profileData);
                setUserProfile(profileData);
                setIsLoadingProfile(false);
                return;
            }

            // If no user_metadata, try to fetch from a custom users table
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('name, surname')
                    .eq('user_id', user.id)
                    .single();

                if (!isMounted) return;

                if (error) {
                    console.error('Error fetching from users table:', error);
                    // Fallback to email-based name
                    setUserProfile({
                        name: user.email?.split('@')[0] || 'User',
                        surname: ''
                    });
                } else {
                    setUserProfile(data);
                }
            } catch (tableError) {
                console.error('Error with users table:', tableError);
                // Fallback to email-based name
                setUserProfile({
                    name: user.email?.split('@')[0] || 'User',
                    surname: ''
                });
            }
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            // Final fallback
            setUserProfile({
                name: user.email?.split('@')[0] || 'User',
                surname: ''
            });
        } finally {
            if (isMounted) {
                setIsLoadingProfile(false);
            }
        }
    };

    fetchUserProfile();

    return () => {
        isMounted = false;
    };
}, [user, supabase]);

    useEffect(() => {
        let isMounted = true;
        
        // Only request location if we don't already have it
        if (navigator.geolocation && !userLocation) {
            console.log('Requesting location permission...');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (!isMounted) return;
                    
                    console.log('Location obtained successfully');
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    fetchNearbyPlaces(location);
                },
                (error) => {
                    if (!isMounted) return;
                    console.error('Error getting location:', error);
                    
                    // Handle specific error cases
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            console.log('Location permission denied by user');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            console.log('Location information unavailable');
                            break;
                        case error.TIMEOUT:
                            console.log('Location request timed out');
                            break;
                        default:
                            console.log('Unknown location error');
                            break;
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        }

        return () => {
            isMounted = false;
        };
    }, [userLocation]); // Only depend on userLocation to prevent infinite loops

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.language-dropdown')) {
                setShowLanguages(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleQuickHelpClick = () => {
        navigate('/quick-help');
    };
    const handleProfileClick = () => {
        navigate('/health-profile');
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/landing');
        } catch (error) {
            console.error('Error logging out:', error);
            navigate('/landing'); // Navigate anyway
        }
    };

    const fetchNearbyPlaces = async (location) => {
        try {
            console.log('Fetching nearby healthcare facilities for location:', location);
            
            // Use Overpass API to find hospitals and clinics near user location
            const radius = 10000; // 10km radius
            const overpassQuery = `
                [out:json][timeout:25];
                (
                  node["amenity"="hospital"](around:${radius},${location.lat},${location.lng});
                  node["amenity"="clinic"](around:${radius},${location.lat},${location.lng});
                  way["amenity"="hospital"](around:${radius},${location.lat},${location.lng});
                  way["amenity"="clinic"](around:${radius},${location.lat},${location.lng});
                );
                out center;
            `;
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch from Overpass API');
            }
            
            const data = await response.json();
            
            const places = data.elements.map(element => {
                const lat = element.lat || element.center?.lat;
                const lng = element.lon || element.center?.lon;
                
                return {
                    id: element.id,
                    name: element.tags?.name || `${element.tags?.amenity} facility`,
                    lat: lat,
                    lng: lng,
                    amenity: element.tags?.amenity,
                    type: element.tags?.amenity,
                    phone: element.tags?.phone || null,
                    website: element.tags?.website || null,
                    address: element.tags?.['addr:full'] || 
                            `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:city'] || ''}`.trim() || 
                            'Address not available'
                };
            }).filter(place => place.lat && place.lng);
            
            console.log('Found places from API:', places);
            
            setNearbyPlaces(places);
            
        } catch (error) {
            console.error('Error fetching healthcare facilities:', error);
            setNearbyPlaces([]);
        }
    };
   
    const calculateDistance = (point1, point2) => {
        const lat1 = point1.lat;
        const lon1 = point1.lng;
        const lat2 = point2.lat;
        const lon2 = point2.lng;

        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return (R * c).toFixed(0); // Distance in meters
    };

    const getCircleColor = (amenity) => {
        switch(amenity) {
            case 'hospital':
                return {
                    fillColor: '#10B981',
                    fillOpacity: 0.15,
                    color: '#10B981',
                    weight: 2
                };
            case 'clinic':
                return {
                    fillColor: '#10B981',
                    fillOpacity: 0.15,
                    color: '#059669',
                    weight: 2
                };
            default:
                return {
                    fillColor: '#6366F1',
                    fillOpacity: 0.15,
                    color: '#4F46E5',
                    weight: 2
                };
        }
    };

    const getMarkerIcon = (amenity) => {
        return amenity === 'hospital' ? hospitalIcon : clinicIcon;
    };

    const handleCallClick = async () => {
        try {
            const { roomId } = await createVideoCall();
            
            // Store caller info for doctor to see
            const callerInfo = {
                name: userProfile?.name || user?.email?.split('@')[0] || 'User',
                surname: userProfile?.surname || '',
                email: user?.email || 'No email provided',
                roomId: roomId,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('activeCall', JSON.stringify(callerInfo));
            navigate(`/video-call/${roomId}`);
        } catch (error) {
            console.error('Failed to create video call:', error);
            alert('Failed to start video call. Please try again.');
        }
    };

    return (
        <div className="home-wrapper">
            {/* Fixed Navbar */}
            <nav className="navbar">
                <div className="navbar-content">
                    <div className="logo">ThusoCare</div>
                    <div className="nav-controls">
                        {/* Language Selector */}
                        <div className="language-dropdown">
                            <button 
                                className="nav-btn language-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLanguages(!showLanguages);
                                }}
                                aria-expanded={showLanguages}
                                aria-haspopup="true"
                            >
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                <span className="nav-text">Change Language</span>
                                <svg className={`nav-icon chevron ${showLanguages ? 'rotate' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showLanguages && (
                                <div className="dropdown-menu">
                                    {['English', 'Sotho', 'IsiZulu', 'Xhosa', 'Afrikaans'].map((lang) => (
                                        <button
                                            key={lang}
                                            className={`dropdown-item ${selectedLanguage === lang ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedLanguage(lang);
                                                setShowLanguages(false);
                                            }}
                                        >
                                            {lang}
                                            {selectedLanguage === lang && (
                                                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        

                        {/* Call a Professional Button */}
                        <button className="nav-btn call-btn"
                            onClick={handleCallClick}>
                            <span className="nav-text">Call a Professional</span>
                        </button>

                        {/* Quick Help */}
                        <button className="nav-btn help-btn"
                            onClick={handleQuickHelpClick}>
                            <span className="nav-text">Quick Medical Help</span>
                        </button>

                        {/* User Circle */}
                        {user && userProfile && !isLoadingProfile && (

                            <div className="user-circle" title={`${userProfile.name} ${userProfile.surname || ''}`.trim()} onClick={handleProfileClick}>
                                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            
                        )}
                        
                        {/* Loading indicator for user profile */}
                        {user && isLoadingProfile && (
                            <div className="user-circle loading">
                                <div className="profile-spinner"></div>
                            </div>
                        )}

                        {/* Debug: Show user info when no profile */}
                        {user && !userProfile && !isLoadingProfile && (
                            <div className="user-circle" title="Debug: No profile loaded">
                                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}

                        {/* Debug: Show when no user */}
                        {!user && (
                            <div className="user-circle" title="Debug: No user">
                                ?
                            </div>
                        )}

                        {/* Logout Button */}
                        {user && (
                            <button 
                                className="logout-btn"
                                onClick={handleLogout}
                                title="Logout"
                            >
                                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="main-content">
                <div className="map-container">
                    <h2>Nearby Healthcare Facilities</h2>
                    {userLocation ? (
                        <MapContainer
                            center={[userLocation.lat, userLocation.lng]}
                            zoom={14}
                            style={{ height: '700px', width: '100%', borderRadius: '12px' }}
                           
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            
                   
                      {/* User location marker */}
                            <Marker 
                                position={[userLocation.lat, userLocation.lng]}
                                icon={userIcon}
                            >
                                <Popup>
                                    <div className="popup-content">
                                        <h3>Your Location</h3>
                                        <p>Latitude: {userLocation.lat.toFixed(4)}</p>
                                        <p>Longitude: {userLocation.lng.toFixed(4)}</p>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Healthcare facilities with circles - ensuring both hospitals and clinics get circles */}
                            {nearbyPlaces.map((place) => {
                                const distance = userLocation ? 
                                    calculateDistance(userLocation, { lat: place.lat, lng: place.lng }) : 0;
                                
                                const circleOptions = getCircleColor(place.amenity);
                                const markerIcon = getMarkerIcon(place.amenity);
                                
                                return (
                                    <React.Fragment key={`facility-${place.id}`}>
                                        {/* Circle for service area - this will show for ALL places */}
                                        <Circle
                                            center={[place.lat, place.lng]}
                                            radius={100} // 1km radius for all facilities
                                            pathOptions={circleOptions}
                                            eventHandlers={{
                                                click: () => {
                                                    // Removed setSelectedPlace as it is unused
                                                }
                                            }}
                                        />     
                                        {/* Marker for the facility */}
                                        <Marker
                                            position={[place.lat, place.lng]}
                                            icon={markerIcon}
                                        >
                                            <Popup maxWidth={300} minWidth={250}>
                                                <div className="popup-content">
                                                    <div className="popup-header">
                                                        <h3>{place.name}</h3>
                                                        <span className={`facility-badge ${place.amenity}`}>
                                                            {place.amenity === 'hospital' ? 'Hospital' : 'Clinic'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="popup-details">
                                                        <div className="detail-row">
                                                            
                                                            <span><strong>Distance:</strong> {(distance/1000).toFixed(1)}km away</span>
                                                        </div>
                                                        
                                                        <div className="detail-row">
                                                            
                                                            
                                                        </div>
                                                        
                                                        {place.address && place.address !== 'Address not available' && (
                                                            <div className="detail-row">
                                                                
                                                                <span><strong>Address:</strong> {place.address}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {place.phone && (
                                                            <div className="detail-row">
                                                                
                                                                <span><strong>Phone:</strong> <a href={`tel:${place.phone}`}>{place.phone}</a></span>
                                                            </div>
                                                        )}
                                                        
                                                        {place.website && (
                                                            <div className="detail-row">
                                                               
                                                                <span><strong>Website:</strong> <a href={place.website} target="_blank" rel="noopener noreferrer">Visit Site</a></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="popup-actions">
                                                        <button className="popup-btn directions-btn">
                                                            
                                                            Get Directions
                                                        </button>
                                                        <button className="popup-btn contact-btn">
                                                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                                            </svg>
                                                            Contact
                                                        </button>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    ) : (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Getting your location...</p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                Please allow location access when prompted
                            </p>
                            <button 
                                onClick={() => {
                                    setUserLocation(null);
                                    // This will trigger the useEffect to request location again
                                }}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                    
                </div>
            </div>

            {/* Error Modal */}
            {showErrorModal && (
                <div className="modal-overlay">
                    <div className="error-modal">
                        <h3>Sorry</h3>
                        <p>{errorMessage}</p>
                        <button 
                            className="modal-btn"
                            onClick={() => setShowErrorModal(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;