import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUser, FaCar, FaCheckCircle, FaExclamationTriangle, FaBell } from 'react-icons/fa';

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'user':
        return <FaUser className="text-blue-400" />;
      case 'ride':
        return <FaCar className="text-purple-400" />;
      case 'match':
        return <FaCheckCircle className="text-green-400" />;
      case 'emergency':
        return <FaExclamationTriangle className="text-red-400 animate-pulse" />;
      default:
        return <FaBell className="text-accent-green" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'emergency':
        return 'from-red-500/20 to-red-600/10 border-red-500/30';
      case 'match':
        return 'from-green-500/20 to-green-600/10 border-green-500/30';
      default:
        return 'from-accent-green/20 to-blue-500/10 border-accent-green/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className={`bg-gradient-to-r ${getBgColor()} backdrop-blur-lg border rounded-2xl p-4 shadow-2xl max-w-sm w-full`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-sm mb-1">{notification.title}</h4>
          <p className="text-xs text-gray-300">{notification.message}</p>
          {notification.amount && (
            <p className="text-xs text-accent-green font-bold mt-1">₹{notification.amount}</p>
          )}
          <span className="text-[10px] text-gray-500 mt-1 block">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </motion.div>
  );
};

const NotificationContainer = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast notification={notification} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer;
