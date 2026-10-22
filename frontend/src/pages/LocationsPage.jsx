import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Building2, Users, Clock, ArrowRight, Activity, Filter } from 'lucide-react';

const LocationsPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);

  const fetchLocations = async () => {
    try {
      const url = category ? `/locations?category=${category}` : '/locations';
      const res = await axiosClient.get(url);
      if (res.success) {
        setLocations(res.data);
      }
    } catch (err) {
      console.error('Failed to load locations', err);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveTicket = async () => {
    try {
      const res = await axiosClient.get('/queues/my/active');
      if (res.success && res.data) {
        setActiveTicket(res.data);
      }
    } catch (err) {
      // No active ticket
    }
  };

  useEffect(() => {
    fetchLocations();
    checkActiveTicket();
  }, [category]);

  const handleJoinQueue = async (locationId) => {
    try {
      const res = await axiosClient.post(`/queues/${locationId}/join`);
      if (res.success) {
        navigate(`/queue/${locationId}`);
      }
    } catch (err) {
      alert(err.message || 'Unable to join queue');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Active Ticket Banner */}
      {activeTicket && (
        <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide">You Have an Active Ticket</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {activeTicket.location?.name} • Token #{activeTicket.tokenNumber}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Position: <span className="font-semibold text-slate-900">{activeTicket.position}</span> | Status:{' '}
              <span className="font-semibold capitalize text-indigo-600">{activeTicket.status}</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/queue/${activeTicket.location?._id || activeTicket.location}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Go to My Ticket
          </button>
        </div>
      )}

      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Locations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Join virtual waiting queues remotely</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="hospital">Hospital</option>
            <option value="bank">Bank</option>
            <option value="government">Government</option>
            <option value="restaurant">Restaurant</option>
            <option value="retail">Retail</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No service locations available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => {
            const isMyActiveLoc = activeTicket?.location?._id === loc._id || activeTicket?.location === loc._id;

            return (
              <div
                key={loc._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {loc.category}
                    </span>
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        loc.status === 'open'
                          ? 'text-emerald-600'
                          : loc.status === 'paused'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          loc.status === 'open'
                            ? 'bg-emerald-500'
                            : loc.status === 'paused'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                      {loc.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{loc.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{loc.address}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{loc.currentQueueLength} in line</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>~{loc.estimatedWaitTime} mins wait</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {isMyActiveLoc ? (
                    <button
                      onClick={() => navigate(`/queue/${loc._id}`)}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <span>View Active Ticket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinQueue(loc._id)}
                      disabled={loc.status !== 'open'}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1"
                    >
                      <span>{loc.status === 'open' ? 'Join Virtual Queue' : 'Queue Closed'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationsPage;