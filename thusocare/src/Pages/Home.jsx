import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import CallIcon from '../images/call.png';
import { useAuth } from '../context/AuthContext';
import { createVideoCall } from '../services/videoCallService';
import '../Styling/Home.css';


const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showLanguages, setShowLanguages] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    
    // Hardcoded healthcare facilities around Johannesburg
    const hardcodedPlaces = [
        {
            id: 'hospital-1',
            name: 'Charlotte Maxeke Johannesburg Academic Hospital',
            lat: -26.1844,
            lng: 28.0334,
            amenity: 'hospital',
            type: 'hospital',
            phone: '+27 11 488 4911',
            website: 'https://www.wits.ac.za/clinicalmed/departments/surgery/divisions/orthopaedic-surgery/about-us/facilities-/charlotte-maxeke-johannesburg-academic-hospital/',
            address: 'Parktown, Johannesburg, 2193'
        },
        {
            id: 'hospital-2',
            name: 'Helen Joseph Hospital',
            lat: -26.1622,
            lng: 27.9967,
            amenity: 'hospital',
            type: 'hospital',
            phone: '+27 11 535 3000',
            website: 'https://www.gauteng.gov.za/',
            address: 'Perth Road, Auckland Park, Johannesburg, 2092'
        },
        {
            id: 'hospital-3',
            name: 'Chris Hani Baragwanath Academic Hospital',
            lat: -26.2489,
            lng: 27.9083,
            amenity: 'hospital',
            type: 'hospital',
            phone: '+27 11 933 8000',
            website: 'https://www.gauteng.gov.za/',
            address: 'Chris Hani Road, Diepkloof, Soweto, 1864'
        },
        {
            id: 'hospital-4',
            name: 'Tara Hospital',
            lat: -26.1422,
            lng: 28.0589,
            amenity: 'hospital',
            type: 'hospital',
            phone: '+27 11 535 3000',
            website: 'https://www.facebook.com/TaraHospitalofficial/',
            address: 'Parktown, Johannesburg, 2193'
        },
        {
            id: 'clinic-1',
            name: 'Hillbrow Community Health Centre',
            lat: -26.1897,
            lng: 28.0444,
            amenity: 'clinic',
            type: 'clinic',
            phone: '+27 11 720 7000',
            website: null,
            address: 'Hillbrow, Johannesburg, 2001'
        },
        {
            id: 'clinic-2',
            name: 'Yeoville Community Health Centre',
            lat: -26.1856,
            lng: 28.0589,
            amenity: 'clinic',
            type: 'clinic',
            phone: '+27 11 720 7000',
            website: null,
            address: 'Yeoville, Johannesburg, 2198'
        },
        {
            id: 'clinic-3',
            name: 'Alexandra Community Health Centre',
            lat: -26.1089,
            lng: 28.0844,
            amenity: 'clinic',
            type: 'clinic',
            phone: '+27 11 720 7000',
            website: null,
            address: 'Alexandra, Johannesburg, 2090'
        },
        {
            id: 'clinic-4',
            name: 'Sandton Community Health Centre',
            lat: -26.1089,
            lng: 28.0589,
            amenity: 'clinic',
            type: 'clinic',
            phone: '+27 11 720 7000',
            website: null,
            address: 'Sandton, Johannesburg, 2196'
        },
        {
            id: 'hospital-5',
            name: 'Milpark Hospital',
            lat: -26.1897,
            lng: 28.0334,
            amenity: 'hospital',
            type: 'hospital',
            phone: '+27 11 480 5600',
            website: 'https://www.netcare.co.za/netcare-facilities/netcare-milpark-hospital',
            address: '9 Guild Road, Parktown, Johannesburg, 2193'
        },
        {
            id: 'hospital-6',
            name: 'Netcare Rosebank Hospital',
            lat: -26.1422,
            lng: 28.0444,
            amenity: 'hospital',
            type: 'hospital',
            phone: '+27 11 328 0500',
            website: 'https://www.netcare.co.za/',
            address: 'Oxford Road, Rosebank, Johannesburg, 2196'
        }
    ];

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

    // Initialize Supabase client
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const fetchNearbyPlaces = async (location) => {
        try {
            console.log('Loading hardcoded healthcare facilities for location:', location);
            
            // Filter hardcoded places to show only those within reasonable distance
            const filteredPlaces = hardcodedPlaces.filter(place => {
                const distance = calculateDistance(location, { lat: place.lat, lng: place.lng });
                // Show places within 50km radius
                return distance <= 50000;
            });
            
            console.log('Filtered places within range:', filteredPlaces);
            setNearbyPlaces(filteredPlaces);
            
        } catch (error) {
            console.error('Error loading healthcare facilities:', error);
            // Fallback to all hardcoded places if there's an error
            setNearbyPlaces(hardcodedPlaces);
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

    // Updated handleCallClick function for Home.js
const handleCallClick = async () => {
    try {
        // Add loading state
        console.log('Starting video call...', { user });
        
        // Validate user authentication
        if (!user || !user.id) {
            console.error('User not authenticated');
            alert('Please log in to start a video call');
            navigate('/login');
            return;
        }

        // For now, we'll create a call without a specific receiver
        // In a real app, you'd typically select a doctor or healthcare provider
        console.log('Creating video call with user ID:', user.id);
        
        // Use the imported service function
        const { call, channel } = await createVideoCall(null, user.id); // null for receiver_id for now, pass user.id
        
        console.log('Call created successfully:', call);
        console.log('Channel created:', channel);

        // Navigate to video call with the call ID
        console.log('Attempting to navigate to:', `/video-call/${call.id}`);
        console.log('Call object:', call);
        console.log('Call ID:', call.id);
        
        // Navigate to video call with the call ID
        console.log('About to call navigate function');
        const navigationResult = navigate(`/video-call/${call.id}`);
        console.log('Navigation result:', navigationResult);
        
        // Add a small delay to see if navigation happens
        setTimeout(() => {
            console.log('Current location after navigation attempt:', window.location.pathname);
            console.log('Current URL:', window.location.href);
        }, 100);
        
    } catch (err) {
        console.error('Error starting video call:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        });
        
        // Show user-friendly error message
        if (err.message?.includes('permission')) {
            alert('Permission denied. Please check your database permissions.');
        } else if (err.message?.includes('network')) {
            alert('Network error. Please check your connection and try again.');
        } else {
            alert(`Failed to start video call: ${err.message || 'Unknown error'}`);
        }
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

                        {/* Call Button */}
                        <button 
                            className="nav-btn call-btn"
                            onClick={handleCallClick}
                        >
                            <img src={CallIcon} alt="Call" className="callIcon" />
                            <span className="nav-text">Call a Professional</span>
                        </button>

                       

                        {/* Quick Help */}
                        <button className="nav-btn help-btn">
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="nav-text">Quick Medical Help</span>
                        </button>



                        {/* User Circle */}
                        {user && userProfile && !isLoadingProfile && (
                            <div className="user-circle" title={`${userProfile.name} ${userProfile.surname || ''}`.trim()}>
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
                            style={{ height: '500px', width: '100%', borderRadius: '12px' }}
                            // Removed whenCreated and setMap because 'map' is unused.
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
                                            radius={1000} // 1km radius for all facilities
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
                                                            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                            </svg>
                                                            <span><strong>Distance:</strong> {(distance/1000).toFixed(1)}km away</span>
                                                        </div>
                                                        
                                                        <div className="detail-row">
                                                            <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <circle cx="12" cy="12" r="10"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8"/>
                                                            </svg>
                                                            
                                                        </div>
                                                        
                                                        {place.address && place.address !== 'Address not available' && (
                                                            <div className="detail-row">
                                                                <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                                                </svg>
                                                                <span><strong>Address:</strong> {place.address}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {place.phone && (
                                                            <div className="detail-row">
                                                                <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                                                </svg>
                                                                <span><strong>Phone:</strong> <a href={`tel:${place.phone}`}>{place.phone}</a></span>
                                                            </div>
                                                        )}
                                                        
                                                        {place.website && (
                                                            <div className="detail-row">
                                                                <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                                                </svg>
                                                                <span><strong>Website:</strong> <a href={place.website} target="_blank" rel="noopener noreferrer">Visit Site</a></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="popup-actions">
                                                        <button className="popup-btn directions-btn">
                                                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"/>
                                                            </svg>
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
        </div>
    );
};

export default Home;