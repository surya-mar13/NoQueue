import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const AnalyticsCharts = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* 4 KPI summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Current Queue</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {analytics.currentQueueLength}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Total Served Today</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {analytics.totalServedToday}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Average Service Time</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {analytics.averageWaitTime} mins
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Algorithm Status</span>
          </div>
          <div className="text-sm font-bold text-emerald-600 mt-2">
            Active (Recency WMA)
          </div>
        </div>
      </div>

      {/* Peak hours chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Peak Hours Traffic Distribution</h3>
        <p className="text-xs text-slate-500 mb-6">Historical visitor check-in volume bucketed by 24-hour cycle</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.peakHoursChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="visitors" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;