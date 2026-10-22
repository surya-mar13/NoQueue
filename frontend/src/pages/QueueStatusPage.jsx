import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Bell, Clock, Users, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';

const QueueStatusPage = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();

  const [entry, setEntry] = useState(null);
  const [location, setLocation] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real-time WebSocket hook for location room
  const { connected, queueSummary, myPosition, isCalled, calledInfo } = useQueueSocket(locationId);

  const loadTicketAndLocation = async () => {
    try {
      const [ticketRes, locRes, predRes] = await Promise.all([
        axiosClient.get('/queues/my/active'),
        axiosClient.get(`/locations/${locationId}`),
        axiosClient.get(`/predictions/${locationId}/wait`),
      ]);

      if (locRes.success) setLocation(locRes.data);
      if (predRes.success) setPrediction(predRes.data);
      if (ticketRes.success && ticketRes.data) {
        setEntry(ticketRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketAndLocation();
  }, [locationId]);

  // Sync position from socket hook
  const currentPos = myPosition !== null ? myPosition : entry?.position;

  const handleLeaveQueue = async () => {
    if (!window.confirm('Are you sure you want to leave this queue? Your ticket will be cancelled.')) return;
    try {
      await axiosClient.delete(`/queues/${locationId}/leave`);
      navigate('/locations');
    } catch (err) {
      alert(err.message || 'Error leaving queue');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/locations')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Locations</span>
      </button>

      {/* Calling Notification Banner */}
      {isCalled && (
        <div className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center gap-4 animate-bounce">
          <Bell className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="text-base font-bold text-emerald-900">It's your turn!</h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Please proceed immediately to the service counter. Your token is active.
            </p>
          </div>
        </div>
      )}

      {/* Queue Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
        {/* Connection status tag */}
        <div className="flex justify-center mb-4">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {connected ? 'Live Sync Active' : 'Connecting...'}
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-900">{location?.name}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{location?.address}</p>

        {/* Big Token Display */}
        <div className="my-8 py-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Token Number</div>
          <div className="text-5xl font-black text-indigo-600 mt-2 tracking-tight">
            {entry?.tokenNumber || '---'}
          </div>
          <div className="mt-3">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                isCalled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {isCalled ? 'Now Serving You' : 'Waiting in Line'}
            </span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 text-left my-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Position Ahead</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {currentPos > 0 ? `#${currentPos}` : '0'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Estimated Wait</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {prediction ? `~${prediction.estimatedWaitMinutes} mins` : 'Calculating...'}
            </div>
          </div>
        </div>

        {/* Leave Queue Button */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={handleLeaveQueue}
            className="w-full sm:w-auto px-6 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 mx-auto"
          >
            <XCircle className="w-4 h-4" />
            <span>Leave Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueueStatusPage;