import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import LocationModal from '../components/LocationModal';
import LiveQueueTable from '../components/LiveQueueTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { Plus, Edit2, Trash2, Users, BarChart2, RefreshCw } from 'lucide-react';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [liveQueue, setLiveQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('queue');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLocations = async () => {
    try {
      // Scoped fetch: vendors only get locations they created
      const url = user?.role === 'admin' ? '/locations' : '/locations?scoped=true';
      const res = await axiosClient.get(url);
      if (res.success) {
        setLocations(res.data);
        if (res.data.length > 0) {
          if (!selectedLocation || !res.data.some((l) => l._id === selectedLocation._id)) {
            setSelectedLocation(res.data[0]);
          }
        } else {
          setSelectedLocation(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLiveQueue = async (locId) => {
    if (!locId) return;
    try {
      const res = await axiosClient.get(`/queues/${locId}`);
      if (res.success) {
        setLiveQueue(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async (locId) => {
    if (!locId) return;
    try {
      const res = await axiosClient.get(`/analytics/${locId}`);
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLocation) {
      fetchLiveQueue(selectedLocation._id);
      fetchAnalytics(selectedLocation._id);
    }
  }, [selectedLocation]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingLocation) {
        await axiosClient.put(`/locations/${editingLocation._id}`, formData);
      } else {
        await axiosClient.post('/locations', formData);
      }
      setModalOpen(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteLocation = async (locId) => {
    if (!window.confirm('Delete this location and all its associated queues?')) return;
    try {
      await axiosClient.delete(`/locations/${locId}`);
      setSelectedLocation(null);
      fetchLocations();
    } catch (err) {
      alert(err.message || 'Error deleting location');
    }
  };

  const handleCallNext = async () => {
    if (!selectedLocation) return;
    setLoading(true);
    try {
      await axiosClient.post(`/queues/${selectedLocation._id}/call-next`);
      fetchLiveQueue(selectedLocation._id);
      fetchAnalytics(selectedLocation._id);
    } catch (err) {
      alert(err.message || 'Error calling next');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (entryId, status) => {
    try {
      await axiosClient.patch(`/queues/entry/${entryId}/status`, { status });
      fetchLiveQueue(selectedLocation._id);
      fetchAnalytics(selectedLocation._id);
    } catch (err) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleRemoveUser = async (entryId) => {
    if (!window.confirm('Remove this user from the queue?')) return;
    handleUpdateStatus(entryId, 'cancelled');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.role === 'admin' ? 'Admin Control Center' : 'Vendor Queue Desk'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'admin'
              ? 'Platform-wide control over all registered facilities and queues'
              : 'Manage your facility service counters, call patients, and monitor ETA metrics'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingLocation(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service Center</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            My Service Locations ({locations.length})
          </div>

          <div className="space-y-2">
            {locations.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No locations yet. Click "+ Add New Service Center" above.
              </div>
            ) : (
              locations.map((loc) => {
                const isSelected = selectedLocation?._id === loc._id;
                return (
                  <div
                    key={loc._id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold text-slate-900 truncate">{loc.name}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{loc.category} • {loc.status}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLocation(loc);
                          setModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLocation(loc._id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedLocation ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab('queue')}
                    className={`flex items-center gap-1.5 text-xs font-bold pb-1 transition border-b-2 ${
                      activeTab === 'queue'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Live Queue Desk</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-1.5 text-xs font-bold pb-1 transition border-b-2 ${
                      activeTab === 'analytics'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Analytics & Predictions</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    fetchLiveQueue(selectedLocation._id);
                    fetchAnalytics(selectedLocation._id);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {activeTab === 'queue' ? (
                <LiveQueueTable
                  entries={liveQueue}
                  onCallNext={handleCallNext}
                  onUpdateStatus={handleUpdateStatus}
                  onRemoveUser={handleRemoveUser}
                  loading={loading}
                />
              ) : (
                <AnalyticsCharts analytics={analytics} />
              )}
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select or add a service center to start managing queues.
            </div>
          )}
        </div>
      </div>

      <LocationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingLocation}
      />
    </div>
  );
};

export default AdminDashboardPage;