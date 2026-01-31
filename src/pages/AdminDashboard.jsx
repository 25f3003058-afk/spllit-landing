import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaCar, FaHandshake, FaShieldAlt, FaSignOutAlt, FaPlus, FaTimes, 
  FaChartLine, FaCrown, FaUserShield, FaTrash, FaSync, FaSearch, FaDownload,
  FaBell, FaClock, FaCheckCircle, FaTimesCircle, FaFilter, FaUser,
  FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaUserClock
} from 'react-icons/fa';
import useAdminStore from '../store/adminStore';
import { fetchStats, fetchUsers, fetchRides, fetchMatches, fetchAdmins, createAdmin, deactivateAdmin } from '../services/adminAPI';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, isAuthenticated, logout } = useAdminStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [matches, setMatches] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate, activeTab]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const response = await fetchStats();
        setStats(response.data);
      } else if (activeTab === 'users') {
        const response = await fetchUsers();
        setUsers(response.data.users);
      } else if (activeTab === 'rides') {
        const response = await fetchRides();
        setRides(response.data.rides);
      } else if (activeTab === 'matches') {
        const response = await fetchMatches();
        setMatches(response.data.matches);
      } else if (activeTab === 'admins' && admin?.role === 'master') {
        const response = await fetchAdmins();
        setAdmins(response.data.admins);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await createAdmin(newAdmin);
      setShowAddAdmin(false);
      setNewAdmin({ email: '', password: '', name: '' });
      loadData();
      alert('Admin created successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create admin');
    }
  };

  const handleDeactivateAdmin = async (id) => {
    if (!confirm('Are you sure you want to deactivate this admin?')) return;
    try {
      await deactivateAdmin(id);
      loadData();
      alert('Admin deactivated successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to deactivate admin');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const exportToCSV = (data, filename) => {
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // Filter data based on search and status
  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.college.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'active' && user.isActive) ||
                           (filterStatus === 'inactive' && !user.isActive);
      return matchesSearch && matchesFilter;
    });
  };

  const getFilteredRides = () => {
    return rides.filter(ride => {
      const matchesSearch = ride.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ride.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ride.creator.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || ride.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-white/10 sticky top-0 z-40 backdrop-blur-lg bg-opacity-90">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FaShieldAlt className="text-accent-green text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-accent-green to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-black">{admin?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400">Admin User</span>
                  </div>
                  {admin?.role === 'master' && (
                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      <FaCrown className="text-yellow-400 text-xs" />
                      <span className="text-[10px] text-yellow-400 font-semibold">MASTER</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all text-xs sm:text-sm flex-1 sm:flex-initial ${
                  autoRefresh ? 'bg-accent-green/20 text-accent-green' : 'bg-white/5 text-gray-400'
                }`}
              >
                <FaSync className={`${autoRefresh ? 'animate-spin' : ''} text-sm`} />
                <span className="hidden sm:inline">Auto</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-bg-secondary border-b border-white/10 sticky top-[68px] sm:top-[76px] z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
              { id: 'users', label: 'Users', icon: FaUsers },
              { id: 'rides', label: 'Rides', icon: FaCar },
              { id: 'matches', label: 'Matches', icon: FaHandshake },
              ...(admin?.role === 'master' ? [{ id: 'admins', label: 'Admins', icon: FaUserShield }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'border-accent-green text-accent-green'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="text-sm sm:text-base" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-accent-green"></div>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-4 sm:space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <FaUsers className="text-2xl sm:text-4xl text-blue-400" />
                      <span className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        +{stats.stats.todayUsers}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.stats.totalUsers}</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Total Users</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <FaCar className="text-2xl sm:text-4xl text-purple-400" />
                      <span className="text-[10px] sm:text-xs bg-purple-500/20 text-purple-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        +{stats.stats.todayRides}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.stats.totalRides}</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Total Rides</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <FaHandshake className="text-2xl sm:text-4xl text-green-400" />
                      <span className="text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        {stats.stats.pendingMatches}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.stats.totalMatches}</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Total Matches</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <FaChartLine className="text-2xl sm:text-4xl text-yellow-400" />
                      <span className="text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        Live
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.stats.activeRides}</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Active Rides</p>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-accent-green/5 to-blue-500/5 border border-accent-green/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <FaBell className="text-accent-green" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                    >
                      <FaUsers className="text-xl sm:text-2xl text-blue-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs sm:text-sm font-medium">View Users</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('rides')}
                      className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                    >
                      <FaCar className="text-xl sm:text-2xl text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs sm:text-sm font-medium">View Rides</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('matches')}
                      className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                    >
                      <FaHandshake className="text-xl sm:text-2xl text-green-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs sm:text-sm font-medium">View Matches</span>
                    </button>
                    {admin?.role === 'master' && (
                      <button
                        onClick={() => setShowAddAdmin(true)}
                        className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-accent-green/10 hover:bg-accent-green/20 rounded-xl transition-all group"
                      >
                        <FaPlus className="text-xl sm:text-2xl text-accent-green group-hover:scale-110 transition-transform" />
                        <span className="text-xs sm:text-sm font-medium text-accent-green">Add Admin</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Recent Users */}
                  <div className="bg-bg-secondary border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-xl font-bold flex items-center gap-2">
                        <FaUsers className="text-accent-green" />
                        Recent Users
                      </h3>
                      <span className="text-xs text-gray-500">{stats.recentUsers.length} users</span>
                    </div>
                    <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                      {stats.recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 sm:p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent-green to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs sm:text-sm">{user.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-xs sm:text-sm truncate">{user.name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{user.college}</p>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Rides */}
                  <div className="bg-bg-secondary border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-xl font-bold flex items-center gap-2">
                        <FaCar className="text-accent-green" />
                        Recent Rides
                      </h3>
                      <span className="text-xs text-gray-500">{stats.recentRides.length} rides</span>
                    </div>
                    <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                      {stats.recentRides.map((ride) => (
                        <div key={ride.id} className="p-2 sm:p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FaMapMarkerAlt className="text-accent-green text-xs flex-shrink-0" />
                              <p className="font-semibold text-white text-xs sm:text-sm truncate">
                                {ride.origin}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                              ride.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              ride.status === 'matched' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {ride.status}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-400 ml-5 truncate">→ {ride.destination}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">By {ride.creator.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vehicle Stats */}
                {stats.vehicleStats && (
                  <div className="bg-bg-secondary border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-xl font-bold mb-4">Rides by Vehicle Type</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {stats.vehicleStats.map((item) => (
                        <div key={item.vehicleType} className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-3 sm:p-4 text-center hover:scale-105 transition-transform">
                          <p className="text-xl sm:text-2xl font-bold text-accent-green">{item._count}</p>
                          <p className="text-xs sm:text-sm text-gray-400 capitalize mt-1">{item.vehicleType}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or college..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <button
                      onClick={() => exportToCSV(getFilteredUsers(), 'users.csv')}
                      className="flex items-center gap-2 px-4 py-3 bg-accent-green/10 text-accent-green rounded-xl hover:bg-accent-green/20 transition-all text-sm whitespace-nowrap"
                    >
                      <FaDownload />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-bg-secondary border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Name</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Contact</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">College</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Rides</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Joined</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredUsers().map((user) => (
                          <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                            <td className="p-3 sm:p-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent-green to-blue-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs sm:text-sm font-bold">{user.name[0]}</span>
                                </div>
                                <span className="font-medium text-xs sm:text-sm truncate">{user.name}</span>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <p className="text-gray-400 text-xs sm:text-sm truncate">{user.email.split('@')[0]}@***</p>
                              <p className="text-gray-500 text-[10px] sm:text-xs">{user.phone || 'N/A'}</p>
                            </td>
                            <td className="p-3 sm:p-4 text-gray-400 text-xs sm:text-sm">
                              <div className="truncate max-w-[150px]">{user.college}</div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="bg-accent-green/20 text-accent-green px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold">
                                {user._count.ridesCreated}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-gray-400 text-xs sm:text-sm">
                              {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                                user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {getFilteredUsers().length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <FaUsers className="mx-auto text-4xl mb-2 opacity-50" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rides Tab */}
            {activeTab === 'rides' && (
              <div className="space-y-4">
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search rides by location or creator..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="matched">Matched</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => exportToCSV(getFilteredRides(), 'rides.csv')}
                      className="flex items-center gap-2 px-4 py-3 bg-accent-green/10 text-accent-green rounded-xl hover:bg-accent-green/20 transition-all text-sm whitespace-nowrap"
                    >
                      <FaDownload />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {/* Rides Grid/Table */}
                <div className="grid gap-4">
                  {getFilteredRides().map((ride) => (
                    <div key={ride.id} className="bg-bg-secondary border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-white/20 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Route Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                              <FaCar className="text-purple-400 text-lg sm:text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FaMapMarkerAlt className="text-accent-green text-xs flex-shrink-0" />
                                <p className="font-bold text-sm sm:text-base truncate">{ride.origin}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-red-400 text-xs flex-shrink-0" />
                                <p className="text-gray-400 text-xs sm:text-sm truncate">{ride.destination}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional Info */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-[10px] sm:text-xs text-gray-400">Creator</p>
                              <p className="text-xs sm:text-sm font-medium truncate">{ride.creator.name}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-[10px] sm:text-xs text-gray-400">Vehicle</p>
                              <p className="text-xs sm:text-sm font-medium capitalize">{ride.vehicleType}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-[10px] sm:text-xs text-gray-400">Fare</p>
                              <p className="text-xs sm:text-sm font-bold text-accent-green">₹{ride.fare}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-[10px] sm:text-xs text-gray-400">Seats</p>
                              <p className="text-xs sm:text-sm font-medium">{ride.seats}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status and Matches */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-3">
                          <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
                            ride.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            ride.status === 'matched' ? 'bg-green-500/20 text-green-400' :
                            ride.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {ride.status}
                          </span>
                          <div className="bg-white/5 rounded-lg px-3 py-1.5">
                            <span className="text-xs text-gray-400">{ride.matches.length} matches</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getFilteredRides().length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-bg-secondary border border-white/10 rounded-2xl">
                      <FaCar className="mx-auto text-4xl mb-2 opacity-50" />
                      <p>No rides found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div className="space-y-4">
                <div className="bg-bg-secondary border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Route</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Rider 1</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Rider 2</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Fare</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Status</th>
                          <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">Matched</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((match) => (
                          <tr key={match.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                            <td className="p-3 sm:p-4">
                              <p className="font-medium text-xs sm:text-sm truncate max-w-[150px]">{match.ride.origin}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[150px]">→ {match.ride.destination}</p>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-accent-green text-xs font-bold">{match.user1.name[0]}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm truncate">{match.user1.name}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">{match.user1.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-400 text-xs font-bold">{match.user2.name[0]}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm truncate">{match.user2.name}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">{match.user2.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="text-accent-green font-bold text-xs sm:text-sm">₹{match.ride.fare}</span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                                match.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                match.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {match.status}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-gray-400 text-xs sm:text-sm">
                              {new Date(match.matchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {matches.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <FaHandshake className="mx-auto text-4xl mb-2 opacity-50" />
                      <p>No matches found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admins Tab (Master Only) */}
            {activeTab === 'admins' && admin?.role === 'master' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">Admin Management</h2>
                  <button
                    onClick={() => setShowAddAdmin(true)}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-accent-green text-black font-bold rounded-xl hover:bg-accent-green/90 transition-all text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <FaPlus />
                    Add New Admin
                  </button>
                </div>

                <div className="grid gap-3 sm:gap-4">
                  {admins.map((adm) => (
                    <div key={adm.id} className="bg-bg-secondary border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            adm.role === 'master' ? 'bg-yellow-500/20' : 'bg-accent-green/20'
                          }`}>
                            {adm.role === 'master' ? (
                              <FaCrown className="text-yellow-400 text-xl sm:text-2xl" />
                            ) : (
                              <FaUserShield className="text-accent-green text-xl sm:text-2xl" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-xl font-bold">{adm.name}</h3>
                              {adm.role === 'master' && (
                                <span className="text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                                  Master Admin
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs sm:text-sm">****@spllit.app</p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              Last login: {adm.lastLogin ? new Date(adm.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                          <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                            adm.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {adm.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {adm.role !== 'master' && adm.isActive && (
                            <button
                              onClick={() => handleDeactivateAdmin(adm.id)}
                              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowAddAdmin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-secondary border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">Add New Admin</h2>
                <button
                  onClick={() => setShowAddAdmin(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-accent-green ml-4 tracking-widest uppercase">Name</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white text-sm"
                    placeholder="Admin name"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-accent-green ml-4 tracking-widest uppercase">Email</label>
                  <input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white text-sm"
                    placeholder="admin@spllit.app"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-accent-green ml-4 tracking-widest uppercase">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 sm:py-4 bg-accent-green text-black font-bold rounded-xl hover:bg-accent-green/90 transition-all text-sm sm:text-base"
                >
                  Create Admin
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
