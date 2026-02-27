import { useState, useEffect } from 'react';

const API = '/api/client';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
}

const STATUS_COLORS = {
  Open: 'bg-orange-50 text-orange-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Resolved: 'bg-green-50 text-green-700',
  Closed: 'bg-slate-100 text-slate-600',
};

export default function ClientIssues() {
  const [issues, setIssues] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssues = () => {
    fetch(`${API}/issues`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Access denied. Your account may not be linked to a customer yet.' : 'Failed to load issues');
        return r.json();
      })
      .then((d) => setIssues(d.issues || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIssues(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setSubmitting(true);
    fetch(`${API}/issues`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject, description }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to submit issue');
        return r.json();
      })
      .then((d) => {
        if (d.success) {
          setSubject('');
          setDescription('');
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          fetchIssues();
        }
      })
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Issues & Support</h1>
      <p className="text-sm text-slate-500 mb-5">Raise a complaint or track existing issues</p>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">error</span>
          <div>
            <p className="text-sm font-bold text-red-800 mb-1">Unable to Load Issues</p>
            <p className="text-sm text-red-600 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
          Raise New Issue
        </h2>

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <span className="material-symbols-outlined ms-fill text-green-600 text-lg">check_circle</span>
            <p className="text-sm font-semibold text-green-700">Issue submitted successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide details about your issue..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !subject.trim()}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>
      </div>

      {/* Issue History */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-lg">history</span>
          <h2 className="text-sm font-bold text-slate-800">Issue History</h2>
        </div>

        {loading && (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">hourglass_top</span>
            <p className="text-sm text-slate-400 mt-2">Loading issues...</p>
          </div>
        )}

        {!loading && !error && issues.length === 0 && (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-slate-300 text-4xl">inbox</span>
            <p className="text-sm text-slate-400 mt-2">No issues raised yet</p>
          </div>
        )}

        {!loading && issues.length > 0 && (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => (
              <div key={issue.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{issue.subject}</p>
                  {issue.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">{issue.createdAt}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  STATUS_COLORS[issue.status] || 'bg-slate-100 text-slate-600'
                }`}>{issue.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
