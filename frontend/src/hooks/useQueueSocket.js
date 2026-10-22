import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useQueueSocket = (locationId) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [queueSummary, setQueueSummary] = useState(null);
  const [myPosition, setMyPosition] = useState(null);
  const [isCalled, setIsCalled] = useState(false);
  const [calledInfo, setCalledInfo] = useState(null);

  const reconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected && locationId) {
      socketRef.current.emit('queue:join', { locationId });
    }
  }, [locationId]);

  useEffect(() => {
    if (!token || !locationId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('queue:join', { locationId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Room-wide queue summary updates
    socket.on('queue:updated', (data) => {
      if (data.locationId === locationId) {
        setQueueSummary(data);
      }
    });

    // Initial position on join snapshot
    socket.on('position:update', (data) => {
      setMyPosition(data.position);
      if (data.status === 'called') {
        setIsCalled(true);
        setCalledInfo(data);
      }
    });

    // Live personal position broadcasts
    if (user?.id || user?._id) {
      const uid = user.id || user._id;

      socket.on(`user:position:${uid}`, (data) => {
        setMyPosition(data.position);
        if (data.status === 'waiting') {
          setIsCalled(false);
        }
      });

      socket.on(`user:called:${uid}`, (data) => {
        setIsCalled(true);
        setCalledInfo(data);
      });
    }

    return () => {
      socket.emit('queue:leave', { locationId });
      socket.disconnect();
    };
  }, [locationId, token, user]);

  return {
    connected,
    queueSummary,
    myPosition,
    isCalled,
    calledInfo,
    reconnect,
  };
};