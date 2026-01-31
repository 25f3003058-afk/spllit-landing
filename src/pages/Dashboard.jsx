import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaSignOutAlt, FaCar, FaMapMarkerAlt, FaTimes, FaCalendarAlt, FaClock, FaUsers, FaRupeeSign, FaMapPin } from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';
import { ridesAPI } from '../services/api';

// Load Google Maps script
const loadGoogleMaps = (callback) => {
    const existingScript = document.getElementById('googleMaps');
    if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBt_YOUR_API_KEY&libraries=places`;
        script.id = 'googleMaps';
        document.body.appendChild(script);
        script.onload = () => {
            if (callback) callback();
        };
    } else {
        if (callback) callback();
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [showCreateRide, setShowCreateRide] = useState(false);
    const [showFindMatches, setShowFindMatches] = useState(false);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form data with location coordinates
    const [rideData, setRideData] = useState({
        origin: '',
        originLat: null,
        originLng: null,
        destination: '',
        destLat: null,
        destLng: null,
        departureTime: '',
        seats: 1,
        fare: '',
        vehicleType: 'cab',
        genderPref: 'any'
    });

    // Refs for autocomplete
    const originRef = useRef(null);
    const destinationRef = useRef(null);
    const originAutocompleteRef = useRef(null);
    const destAutocompleteRef = useRef(null);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isAuthenticated || !user) {
            navigate('/login');
            return;
        }

        // Connect to Socket.IO for real-time features
        socketService.connect(user.id);

        // Load Google Maps
        loadGoogleMaps(() => {
            console.log('Google Maps loaded');
        });

        // Cleanup on unmount
        return () => {
            socketService.disconnect();
        };
    }, [isAuthenticated, user, navigate]);

    // Initialize Google Places Autocomplete
    useEffect(() => {
        if (showCreateRide && window.google) {
            // Origin autocomplete - bias towards Chennai, India
            if (originRef.current && !originAutocompleteRef.current) {
                originAutocompleteRef.current = new window.google.maps.places.Autocomplete(originRef.current, {
                    componentRestrictions: { country: 'in' },
                    fields: ['formatted_address', 'geometry', 'name'],
                    types: ['establishment', 'geocode']
                });

                originAutocompleteRef.current.addListener('place_changed', () => {
                    const place = originAutocompleteRef.current.getPlace();
                    if (place.geometry) {
                        setRideData(prev => ({
                            ...prev,
                            origin: place.formatted_address || place.name,
                            originLat: place.geometry.location.lat(),
                            originLng: place.geometry.location.lng()
                        }));
                    }
                });
            }

            // Destination autocomplete - bias towards Chennai
            if (destinationRef.current && !destAutocompleteRef.current) {
                destAutocompleteRef.current = new window.google.maps.places.Autocomplete(destinationRef.current, {
                    componentRestrictions: { country: 'in' },
                    fields: ['formatted_address', 'geometry', 'name'],
                    types: ['establishment', 'geocode']
                });

                destAutocompleteRef.current.addListener('place_changed', () => {
                    const place = destAutocompleteRef.current.getPlace();
                    if (place.geometry) {
                        setRideData(prev => ({
                            ...prev,
                            destination: place.formatted_address || place.name,
                            destLat: place.geometry.location.lat(),
                            destLng: place.geometry.location.lng()
                        }));
                    }
                });
            }
        }
    }, [showCreateRide]);

    const handleLogout = () => {
        socketService.disconnect();
        logout();
        navigate('/login');
    };

    const handleCreateRide = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate coordinates
        if (!rideData.destLat || !rideData.destLng) {
            setError('Please select a valid destination from the dropdown');
            setLoading(false);
            return;
        }

        // Calculate per person fare
        const totalSeats = parseInt(rideData.seats) || 1;
        const totalFare = parseFloat(rideData.fare) || 0;
        const perPersonFare = totalFare > 0 ? (totalFare / totalSeats).toFixed(2) : 0;

        const submitData = {
            origin: rideData.origin,
            originLat: rideData.originLat,
            originLng: rideData.originLng,
            destination: rideData.destination,
            destLat: rideData.destLat,
            destLng: rideData.destLng,
            departureTime: new Date(rideData.departureTime).toISOString(),
            seats: totalSeats,
            fare: totalFare,
            vehicleType: rideData.vehicleType,
            genderPref: rideData.genderPref
        };

        try {
            const response = await ridesAPI.createRide(submitData);
            setSuccess(`Ride created! ₹${perPersonFare}/person when shared. Finding matches...`);
            setShowCreateRide(false);
            // Reset form
            setRideData({
                origin: '', originLat: null, originLng: null,
                destination: '', destLat: null, destLng: null,
                departureTime: '', seats: 1, fare: '',
                vehicleType: 'cab', genderPref: 'any'
            });
            setTimeout(() => {
                setSuccess('');
                handleSearchRides(); // Auto-search for matches
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create ride');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchRides = async () => {
        setLoading(true);
        setError('');

        try {
            // Search for rides within 30 minutes and same destination
            const response = await ridesAPI.searchRides({
                destination: 'Chennai', // This can be made dynamic
                destLat: 13.0827, // Chennai coordinates
                destLng: 80.2707,
                departureTime: new Date().toISOString(),
                timeWindowMinutes: 30,
                maxDistance: 5
            });
            setRides(response.rides || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch rides');
        } finally {
            setLoading(false);
        }
    };

    // Calculate fare per person
    const calculateFarePerPerson = (totalFare, seats) => {
        const fare = parseFloat(totalFare) || 0;
        const seatCount = parseInt(seats) || 1;
        return fare > 0 ? (fare / seatCount).toFixed(2) : '0.00';
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] overflow-hidden relative font-poppins">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 z-0 opacity-30">
                <svg className="w-full h-full" width="100%" height="100%">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="container mx-auto px-6 pt-20 pb-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                            Welcome to <span className="text-accent-green">Spllit</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Your smart ride-matching dashboard is ready!
                        </p>
                    </div>

                    {/* User Profile Card */}
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-bg-secondary border border-white/10 rounded-3xl p-8 mb-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-accent-green/20 border-2 border-accent-green rounded-2xl flex items-center justify-center">
                                    <FaUser className="text-accent-green text-3xl" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                                    <p className="text-gray-500 text-sm">{user.college || 'IIT Madras BS Degree'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2 font-medium"
                            >
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <FaEnvelope className="text-accent-green" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Email</span>
                                </div>
                                <p className="text-white font-medium">{user.email}</p>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <FaPhone className="text-accent-green" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Phone</span>
                                </div>
                                <p className="text-white font-medium">{user.phone || 'Not provided'}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Create Ride Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setShowCreateRide(true)}
                            className="bg-bg-secondary border border-white/10 rounded-3xl p-8 cursor-pointer hover:border-accent-green/30 transition-all group"
                        >
                            <div className="w-16 h-16 bg-accent-green/20 border-2 border-accent-green rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FaCar className="text-accent-green text-2xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Create Ride</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Post your ride request and find students going to the same exam center within 30 minutes.
                            </p>
                            <div className="mt-6 text-accent-green font-bold text-sm uppercase tracking-wider">
                                Create Now →
                            </div>
                        </motion.div>

                        {/* Find Matches Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            onClick={() => { setShowFindMatches(true); handleSearchRides(); }}
                            className="bg-bg-secondary border border-white/10 rounded-3xl p-8 cursor-pointer hover:border-accent-green/30 transition-all group"
                        >
                            <div className="w-16 h-16 bg-purple-500/20 border-2 border-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FaMapMarkerAlt className="text-purple-500 text-2xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Find Matches</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Browse available rides and connect with verified students for safe group travel.
                            </p>
                            <div className="mt-6 text-accent-green font-bold text-sm uppercase tracking-wider">
                                Find Rides →
                            </div>
                        </motion.div>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 bg-accent-green/10 border border-accent-green/20 rounded-2xl p-6 text-center"
                        >
                            <p className="text-accent-green font-bold text-lg">
                                🎉 {success}
                            </p>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center"
                        >
                            <p className="text-red-400 font-bold text-lg">
                                ❌ {error}
                            </p>
                        </motion.div>
                    )}

                    {/* Status Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 bg-accent-green/10 border border-accent-green/20 rounded-2xl p-6 text-center"
                    >
                        <p className="text-accent-green font-bold text-lg">
                            🎉 Backend Integration Complete!
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Your login is now connected to the backend API. Socket.IO real-time features are ready!
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Create Ride Modal */}
            <AnimatePresence>
                {showCreateRide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowCreateRide(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bg-secondary border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-white">Create Ride</h2>
                                <button
                                    onClick={() => setShowCreateRide(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <FaTimes size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRide} className="space-y-6">
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        <FaMapPin className="inline mr-2 text-accent-green" />
                                        Origin (Your Location)
                                    </label>
                                    <input
                                        ref={originRef}
                                        type="text"
                                        value={rideData.origin}
                                        onChange={(e) => setRideData({...rideData, origin: e.target.value})}
                                        required
                                        placeholder="Type: Velachery, IIT Madras, etc."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-green transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Start typing to see suggestions</p>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        <FaMapMarkerAlt className="inline mr-2 text-purple-500" />
                                        Destination (Exam Center)
                                    </label>
                                    <input
                                        ref={destinationRef}
                                        type="text"
                                        value={rideData.destination}
                                        onChange={(e) => setRideData({...rideData, destination: e.target.value})}
                                        required
                                        placeholder="Type: Fortune Tower Chennai, Anna University, etc."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-green transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Google Maps will auto-search location</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            <FaCalendarAlt className="inline mr-2" />
                                            Departure Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={rideData.departureTime}
                                            onChange={(e) => setRideData({...rideData, departureTime: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-green transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            <FaUsers className="inline mr-2" />
                                            Available Seats
                                        </label>
                                        <input
                                            type="number"
                                            value={rideData.seats}
                                            onChange={(e) => setRideData({...rideData, seats: e.target.value})}
                                            min="1"
                                            max="4"
                                            required
                                            placeholder="1-4"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-green transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        <FaRupeeSign className="inline mr-2" />
                                        Total Fare (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={rideData.fare}
                                        onChange={(e) => setRideData({...rideData, fare: e.target.value})}
                                        min="0"
                                        step="0.01"
                                        placeholder="e.g., 300"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-green transition-colors"
                                    />
                                    {rideData.fare && rideData.seats && (
                                        <p className="text-sm text-accent-green mt-2">
                                            ₹{calculateFarePerPerson(rideData.fare, rideData.seats)} per person when shared
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            Vehicle Type
                                        </label>
                                        <select
                                            value={rideData.vehicleType}
                                            onChange={(e) => setRideData({...rideData, vehicleType: e.target.value})}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-green transition-colors"
                                        >
                                            <option value="cab">Cab</option>
                                            <option value="auto">Auto</option>
                                            <option value="bike">Bike</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">
                                            Gender Preference
                                        </label>
                                        <select
                                            value={rideData.genderPref}
                                            onChange={(e) => setRideData({...rideData, genderPref: e.target.value})}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-green transition-colors"
                                        >
                                            <option value="any">Any</option>
                                            <option value="male">Male Only</option>
                                            <option value="female">Female Only</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-accent-green text-black font-bold rounded-xl hover:bg-accent-green/90 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Ride & Find Matches'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Find Matches Modal */}
            <AnimatePresence>
                {showFindMatches && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowFindMatches(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bg-secondary border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-white">Available Rides</h2>
                                <button
                                    onClick={() => setShowFindMatches(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <FaTimes size={24} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-green mx-auto"></div>
                                    <p className="text-gray-400 mt-4">Loading available rides...</p>
                                </div>
                            ) : rides.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaCar className="text-gray-600 text-6xl mx-auto mb-4" />
                                    <p className="text-gray-400 text-lg">No rides available at the moment</p>
                                    <p className="text-gray-500 text-sm mt-2">Create a ride to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {rides.map((ride) => (
                                        <div
                                            key={ride.id}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-accent-green/30 transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-2">
                                                        {ride.origin} → {ride.destination}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm">
                                                        <FaClock className="inline mr-2" />
                                                        {new Date(ride.departureTime).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-accent-green font-bold text-lg">
                                                        {ride.seatsAvailable} seats
                                                    </p>
                                                    <p className="text-gray-500 text-sm">available</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-4">
                                                <button className="flex-1 py-3 bg-accent-green text-black font-bold rounded-xl hover:bg-accent-green/90 transition-all">
                                                    Request to Join
                                                </button>
                                                <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
