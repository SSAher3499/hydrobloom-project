import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

interface TelemetryData {
  sensors: Array<{
    id: string;
    type: string;
    latestValue: number | null;
    unit: string | null;
    zoneId: string;
  }>;
  timestamp: Date;
}

export const useSocket = (farmId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!farmId) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socket.emit('subscribe', { farmId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('telemetry', (data: TelemetryData) => {
      setTelemetry(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [farmId]);

  return { telemetry, isConnected, socket: socketRef.current };
};