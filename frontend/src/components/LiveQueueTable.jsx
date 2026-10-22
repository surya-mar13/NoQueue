import React from 'react';
import { PhoneCall, Check, UserX, Trash2, Clock } from 'lucide-react';

const LiveQueueTable = ({ entries, onCallNext, onUpdateStatus, onRemoveUser, loading }) => {
  const calledEntry = entries.find((e) => e.status === 'called');
  const waitingEntries = entries.filter((e) => e.status === 'waiting');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Top action bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-900">Active Queue Flow</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {waitingEntries.length} waiting • {calledEntry ? '1 at counter' : '0 at counter'}
          </p>
        </div>

        <button
          onClick={onCallNext}
          disabled={loading || waitingEntries.length === 0 || !!calledEntry}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Next Person</span>
        </button>
      </div>

      {/* Currently called banner */}
      {calledEntry && (
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Currently Serving: Token #{calledEntry.tokenNumber}
              </div>
              <div className="text-sm font-bold text-slate-900">
                {calledEntry.user?.name} ({calledEntry.user?.email})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus(calledEntry._id, 'served')}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Served</span>
            </button>
            <button
              onClick={() => onUpdateStatus(calledEntry._id, 'no_show')}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Mark No-Show</span>
            </button>
          </div>
        </div>
      )}

      {/* Table list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Position</th>
              <th className="py-3 px-4">Token #</th>
              <th className="py-3 px-4">User Details</th>
              <th className="py-3 px-4">Wait Time</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {waitingEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                  Queue is empty. No users waiting.
                </td>
              </tr>
            ) : (
              waitingEntries.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">#{item.position}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {item.tokenNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{item.user?.name}</div>
                    <div className="text-[11px] text-slate-400">{item.user?.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{Math.round((Date.now() - new Date(item.joinedAt).getTime()) / 60000)} mins ago</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 capitalize">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onRemoveUser(item._id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Remove User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveQueueTable;