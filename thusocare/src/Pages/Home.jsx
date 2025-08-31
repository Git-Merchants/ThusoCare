import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import CallIcon from '../images/call.png';
import { useAuth } from '../context/AuthContext';
import '../Styling/Home.css';


const Home = () => {
    // navigate is intentionally left here, though unused,
    // as it's common practice to have it ready for future use.
    const navigate = useNavigate(); 
    const { user } = useAuth();
    const [showLanguages, setShowLanguages] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Initialize Supabase client
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Custom icons
    const hospitalIcon = new Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    const clinicIcon = new Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    const userIcon = new Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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
            const { data, error } = await supabase
                .from('users')
                .select('name, surname')
                .eq('user_id', user.id)
                .single();

            if (!isMounted) return;

            if (error) {
                console.error('Error fetching user profile:', error);
                setUserProfile({
                    name: user.user_metadata?.name || 'User',
                    surname: user.user_metadata?.surname || ''
                });
            } else {
                setUserProfile(data);
            }
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            setUserProfile({
                name: user.user_metadata?.name || 'User',
                surname: user.user_metadata?.surname || ''
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
}, [user, supabase, setUserProfile, setIsLoadingProfile]);

    useEffect(() => {
        let isMounted = true;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (!isMounted) return;
                    
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
                }
            );
        }

        return () => {
            isMounted = false;
        };
    }, []);

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
            // Using Overpass API to fetch hospitals and clinics
            const query = `
                [out:json][timeout:25];
                (
                    node["amenity"="hospital"](around:5000,${location.lat},${location.lng});
                    node["amenity"="clinic"](around:5000,${location.lat},${location.lng});
                    way["amenity"="hospital"](around:5000,${location.lat},${location.lng});
                    way["amenity"="clinic"](around:5000,${location.lat},${location.lng});
                );
                out center body;
            `;
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            
            const data = await response.json();
            const places = data.elements
                .filter(element => element.lat && element.lon) // Ensure coordinates exist
                .map(element => ({
                    id: element.id,
                    name: element.tags?.name || `${element.tags?.amenity || 'Healthcare Facility'}`,
                    lat: element.lat,
                    lng: element.lon,
                    amenity: element.tags?.amenity || 'unknown',
                    type: element.tags?.healthcare || element.tags?.amenity || 'healthcare',
                    phone: element.tags?.phone || null,
                    website: element.tags?.website || null,
                    address: element.tags?.['addr:full'] || 
                             `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:city'] || ''}`.trim() || 
                             'Address not available'
                }));
            
            console.log('Fetched places:', places); 
            setNearbyPlaces(places);
        } catch (error) {
            console.error('Error fetching nearby places:', error);
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
                        <button className="nav-btn call-btn">
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
                            
                    {/* Debug Information */}
                    {nearbyPlaces.length > 0 && (
                        <div className="debug-info">
                            <h4>Found {nearbyPlaces.length} healthcare facilities:</h4>
                            <p>Hospitals: {nearbyPlaces.filter(p => p.amenity === 'hospital').length}</p>
                            <p>Clinics: {nearbyPlaces.filter(p => p.amenity === 'clinic').length}</p>
                        </div>
                    )}

                    {/* Legend */}
                    {nearbyPlaces.length > 0 && (
                        <div className="map-legend">
                            <h4>Legend</h4>
                            <div className="legend-items">
                                <div className="legend-item">
                                    <div className="legend-color hospital-color"></div>
                                    <span>Hospitals (Red circles & markers)</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color clinic-color"></div>
                                    <span>Clinics (Green circles & markers)</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color user-color"></div>
                                    <span>Your Location (Blue marker)</span>
                                </div>
                            </div>
                            <p className="legend-note">Circles show 1km service areas around each facility</p>
                        </div>
                    )}      {/* User location marker */}
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
                        </div>
                    )}
                    
                </div>
            </div>
        </div>
    );
};

export default Home;