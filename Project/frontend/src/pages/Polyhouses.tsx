import React, { useEffect, useState } from 'react';
import { farmApi } from '../services/api';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

const FARM_ID = 'demo-farm-1';

interface Polyhouse {
  id: string;
  name: string;
  capacity: number | null;
  zonesCount: number;
  isActive: boolean;
}

const Polyhouses: React.FC = () => {
  const [polyhouses, setPolyhouses] = useState<Polyhouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolyhouses = async () => {
      try {
        const data = await farmApi.getPolyhouses(FARM_ID);
        setPolyhouses(data.polyhouses);
      } catch (error) {
        console.error('Error fetching polyhouses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolyhouses();
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
          Polyhouses
        </h1>
        <div className="text-sm text-gray-400 bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
          {polyhouses.length} Active Polyhouses
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polyhouses.map((polyhouse) => (
          <div
            key={polyhouse.id}
            className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-neon-cyan hover:shadow-neon transition-all duration-300"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 rounded-lg p-3">
                <BuildingOffice2Icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">{polyhouse.name}</h3>
                <p className="text-sm text-gray-400">
                  {polyhouse.zonesCount} {polyhouse.zonesCount === 1 ? 'Zone' : 'Zones'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Capacity:</span>
                <span className="text-white font-medium">{polyhouse.capacity || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-medium ${polyhouse.isActive ? 'text-neon-green' : 'text-gray-500'}`}>
                  {polyhouse.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Polyhouses;