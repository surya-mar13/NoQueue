import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, ShieldCheck, ArrowRight, Zap, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="bg-slate-50 min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 bg-gradient-to-b from-indigo-50/60 to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mb-6">
            <Zap className="w-3.5 h-3.5" />
            Real-time Queue Prediction Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Stop waiting in lines. <br />
            <span className="text-indigo-600">Queue from anywhere.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            NoQueue eliminates crowded waiting rooms at hospitals, banks, clinics, and government offices.
            Track your live position and arrive exactly when it's your turn.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to={user ? '/locations' : '/register'}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <span>{user ? 'View Live Queues' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/locations"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm transition"
            >
              Browse Locations
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Virtual Check-In</h3>
            <p className="mt-2 text-sm text-slate-600">
              Join queues remotely from your smartphone or laptop. Receive an instant electronic token number.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Accurate ETA Predictions</h3>
            <p className="mt-2 text-sm text-slate-600">
              Our algorithm uses weighted moving averages based on day and hour to calculate reliable wait times.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Instant WebSocket Sync</h3>
            <p className="mt-2 text-sm text-slate-600">
              Watch your position countdown in real time without refreshing. Receive loud visual alerts when called.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;