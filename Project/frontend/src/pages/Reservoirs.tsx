import React, { useEffect, useState } from 'react';
import { farmApi } from '../services/api';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const FARM_ID = 'demo-farm-1';

interface Reservoir {
  id: string;
  name: string;
  capacity: number | null;
  currentLevel: number | null;
  levelPercent: number;
  lastRefill: string | null;
  isActive: boolean;
}

const Reservoirs: React.FC = () => {
  const [reservoirs, setReservoirs] = useState<Reservoir[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservoirs = async () => {
      try {
        const data = await farmApi.getReservoirs(FARM_ID);
        setReservoirs(data.reservoirs);
      } catch (error) {
        console.error('Error fetching reservoirs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservoirs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-neon-cyan text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent">
          Reservoirs
        </h1>
        <div className="text-sm text-gray-400 bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
          {reservoirs.length} Active Reservoirs
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reservoirs.map((reservoir) => (
          <div
            key={reservoir.id}
            className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-neon-cyan hover:shadow-neon transition-all duration-300"
          >
            <div className="flex items-center mb-4">
              <div className="bg-cyan-500 rounded-lg p-3">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">{reservoir.name}</h3>
                <p className="text-sm text-gray-400">{reservoir.levelPercent}% Full</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white font-medium">
                    {reservoir.currentLevel?.toFixed(0) || 0} / {reservoir.capacity?.toFixed(0) || 0} L
                  </span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-3 border border-dark-600">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      reservoir.levelPercent >= 50
                        ? 'bg-gradient-to-r from-primary-500 to-neon-green'
                        : reservoir.levelPercent >= 20
                        ? 'bg-gradient-to-r from-neon-yellow to-neon-pink'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${reservoir.levelPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Refill:</span>
                <span className="text-white font-medium">
                  {reservoir.lastRefill
                    ? new Date(reservoir.lastRefill).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reservoirs;