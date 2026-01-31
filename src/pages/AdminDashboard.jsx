import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaCar, FaHandshake, FaShieldAlt, FaSignOutAlt, FaPlus, FaTimes, FaChartLine, FaCrown, FaUserShield, FaTrash, FaEye, FaSync } from 'react-icons/fa';
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate, activeTab]);

  // Auto-refresh every 3 seconds
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

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center">
                  <FaShieldAlt className="text-accent-green text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-gray-400">
                    {admin?.name} {admin?.role === 'master' && <FaCrown className="inline text-yellow-400 ml-1" />}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  autoRefresh ? 'bg-accent-green/20 text-accent-green' : 'bg-white/5 text-gray-400'
                }`}
              >
                <FaSync className={autoRefresh ? 'animate-spin' : ''} />
                <span className="text-sm">Auto-refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-bg-secondary border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
              { id: 'users', label: 'Users', icon: FaUsers },
              { id: 'rides', label: 'Rides', icon: FaCar },
              { id: 'matches', label: 'Matches', icon: FaHandshake },
              ...(admin?.role === 'master' ? [{ id: 'admins', label: 'Admins', icon: FaUserShield }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-accent-green text-accent-green'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-green"></div>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <FaUsers className="text-4xl text-blue-400" />
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                        +{stats.stats.todayUsers} today
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.stats.totalUsers}</h3>
                    <p className="text-sm text-gray-400">Total Users</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <FaCar className="text-4xl text-purple-400" />
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                        +{stats.stats.todayRides} today
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.stats.totalRides}</h3>
                    <p className="text-sm text-gray-400">Total Rides</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <FaHandshake className="text-4xl text-green-400" />
                      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                        {stats.stats.pendingMatches} pending
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.stats.totalMatches}</h3>
                    <p className="text-sm text-gray-400">Total Matches</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <FaChartLine className="text-4xl text-yellow-400" />
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                        Live
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.stats.activeRides}</h3>
                    <p className="text-sm text-gray-400">Active Rides</p>
                  </motion.div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Users */}
                  <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FaUsers className="text-accent-green" />
                      Recent Users
                    </h3>
                    <div className="space-y-3">
                      {stats.recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                          <div className="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center">
                            <span className="text-accent-green font-bold">{user.name[0]}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.college}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Rides */}
                  <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FaCar className="text-accent-green" />
                      Recent Rides
                    </h3>
                    <div className="space-y-3">
                      {stats.recentRides.map((ride) => (
                        <div key={ride.id} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-white text-sm">
                              {ride.origin} → {ride.destination}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              ride.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              ride.status === 'matched' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {ride.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">By {ride.creator.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vehicle Stats */}
                {stats.vehicleStats && (
                  <div className="bg-bg-secondary border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">Rides by Vehicle Type</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stats.vehicleStats.map((item) => (
                        <div key={item.vehicleType} className="bg-white/5 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-accent-green">{item._count}</p>
                          <p className="text-sm text-gray-400 capitalize">{item.vehicleType}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-bg-secondary border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Name</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Email</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Phone</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">College</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Rides</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Joined</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                <span className="text-accent-green text-sm font-bold">{user.name[0]}</span>
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                          <td className="p-4 text-gray-400 text-sm">{user.phone || 'N/A'}</td>
                          <td className="p-4 text-gray-400 text-sm">{user.college}</td>
                          <td className="p-4 text-accent-green font-semibold">{user._count.ridesCreated}</td>
                          <td className="p-4 text-gray-400 text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-3 py-1 rounded-full ${
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
              </div>
            )}

            {/* Rides Tab */}
            {activeTab === 'rides' && (
              <div className="bg-bg-secondary border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Route</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Creator</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Vehicle</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Fare</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Seats</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Matches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rides.map((ride) => (
                        <tr key={ride.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-4">
                            <p className="font-medium">{ride.origin}</p>
                            <p className="text-xs text-gray-400">→ {ride.destination}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{ride.creator.name}</p>
                            <p className="text-xs text-gray-400">{ride.creator.phone}</p>
                          </td>
                          <td className="p-4 text-gray-400 text-sm capitalize">{ride.vehicleType}</td>
                          <td className="p-4 text-accent-green font-semibold">₹{ride.fare}</td>
                          <td className="p-4 text-gray-400">{ride.seats}</td>
                          <td className="p-4">
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              ride.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              ride.status === 'matched' ? 'bg-green-500/20 text-green-400' :
                              ride.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {ride.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400">{ride.matches.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div className="bg-bg-secondary border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Route</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">User 1</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">User 2</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Fare</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Matched At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((match) => (
                        <tr key={match.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-4">
                            <p className="font-medium text-sm">{match.ride.origin}</p>
                            <p className="text-xs text-gray-400">→ {match.ride.destination}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{match.user1.name}</p>
                            <p className="text-xs text-gray-400">{match.user1.phone}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{match.user2.name}</p>
                            <p className="text-xs text-gray-400">{match.user2.phone}</p>
                          </td>
                          <td className="p-4 text-accent-green font-semibold">₹{match.ride.fare}</td>
                          <td className="p-4">
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              match.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              match.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {match.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">
                            {new Date(match.matchedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admins Tab (Master Only) */}
            {activeTab === 'admins' && admin?.role === 'master' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Admin Management</h2>
                  <button
                    onClick={() => setShowAddAdmin(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-accent-green text-black font-bold rounded-xl hover:bg-accent-green/90 transition-all"
                  >
                    <FaPlus />
                    Add New Admin
                  </button>
                </div>

                <div className="grid gap-4">
                  {admins.map((adm) => (
                    <div key={adm.id} className="bg-bg-secondary border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                          adm.role === 'master' ? 'bg-yellow-500/20' : 'bg-accent-green/20'
                        }`}>
                          {adm.role === 'master' ? (
                            <FaCrown className="text-yellow-400 text-2xl" />
                          ) : (
                            <FaUserShield className="text-accent-green text-2xl" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">{adm.name}</h3>
                            {adm.role === 'master' && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                                Master Admin
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400">{adm.email}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Last login: {adm.lastLogin ? new Date(adm.lastLogin).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          adm.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {adm.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {adm.role !== 'master' && adm.isActive && (
                          <button
                            onClick={() => handleDeactivateAdmin(adm.id)}
                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            <FaTrash />
                          </button>
                        )}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowAddAdmin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-secondary border border-white/10 rounded-3xl p-8 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Admin</h2>
                <button
                  onClick={() => setShowAddAdmin(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={24} />
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
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white"
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
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white"
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
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green/50 text-white"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-accent-green text-black font-bold rounded-xl hover:bg-accent-green/90 transition-all"
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
