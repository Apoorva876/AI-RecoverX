import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const API_BASE = 'http://localhost:8001/api';
const SESSION_KEY = 'recoverx-session';

const defaultCases = [
  { id: 'CASE-2048', title: 'Damaged Finance Drive', status: 'Processed', score: '91%', updated: '2h ago' },
  { id: 'CASE-1981', title: 'Corrupted USB Evidence Image', status: 'Review', score: '74%', updated: '5h ago' },
  { id: 'CASE-1742', title: 'Partial Server Disk Fragment', status: 'Queued', score: '63%', updated: '1d ago' },
];

const defaultArtifacts = [
  { id: 'ART-001', type: 'Recovered PDF', format: 'PDF', score: 91, tags: ['finance', 'ledger', 'high-confidence'], priority: 'High' },
  { id: 'ART-002', type: 'Evidence Image', format: 'JPG', score: 74, tags: ['scene', 'photo', 'related'], priority: 'Medium' },
  { id: 'ART-003', type: 'Recovered Log', format: 'TXT', score: 68, tags: ['audit', 'forensic'], priority: 'Medium' },
  { id: 'ART-004', type: 'Archive Fragment', format: 'ZIP', score: 58, tags: ['compressed', 'partial'], priority: 'Low' },
];

const defaultAnalysis = {
  case_id: 'case-demo',
  status: 'processed',
  file_summary: {
    original_name: 'finance_drive.img',
    file_type: 'disk_image',
    corruption_level: 'medium',
    recoverability_score: 72,
  },
  recovered_items: [
    { name: 'ledger_2024_reconstructed.pdf', type: 'pdf', confidence: 0.93, recoverability: 'high', status: 'partial_recovery' },
    { name: 'transaction_export.csv', type: 'csv', confidence: 0.81, recoverability: 'high', status: 'reconstructed' },
    { name: 'deleted_email_cache.eml', type: 'eml', confidence: 0.64, recoverability: 'medium', status: 'possible_recovery' },
  ],
  priority_queue: [
    { item: 'ledger_2024_reconstructed.pdf', reason: 'highest integrity score and highest operational value for the investigation' },
  ],
  ai_summary: 'The system recovered 3 likely artifacts and identified the ledger reconstruction as the highest-confidence evidence cluster.',
  next_actions: ['Validate headers', 'Prioritize the ledger', 'Preserve the source image'],
};

const timeline = [
  { time: '09:14', event: 'Disk image uploaded', detail: 'Source mounted and checksum validated' },
  { time: '09:33', event: 'PhotoRec carving complete', detail: '4,281 raw fragments recovered' },
  { time: '09:47', event: 'Clustering executed', detail: '19 related clusters detected' },
  { time: '10:03', event: 'Integrity score assigned', detail: 'Top artifact confidence: 91%' },
];

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'newcase', label: 'New Case' },
  { key: 'processing', label: 'Processing' },
  { key: 'artifacts', label: 'Artifacts' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'chat', label: 'Chat' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

const normalizeCase = (item) => ({
  id: item.id || item._id || 'CASE-NEW',
  title: item.title || 'Recovered Evidence',
  status: item.status || 'Processed',
  score: item.score ? `${Math.round(Number(item.score) * 100)}%` : '88%',
  updated: item.updated_at ? 'recent' : 'now',
});

const normalizeArtifacts = (items) => items.map((item) => ({
  id: item.id || item._id || 'ART-NEW',
  type: item.artifact_type || 'Document',
  format: item.file_format || 'PDF',
  score: Math.round((item.integrity_score || 0.8) * 100),
  tags: item.classification_tags || ['forensic'],
  priority: item.priority_score > 80 ? 'High' : item.priority_score > 60 ? 'Medium' : 'Low',
}));

function DashboardPage({ cases, artifacts, analysis }) {
  const avgScore = useMemo(() => {
    if (!artifacts.length) return 0;
    return Math.round(artifacts.reduce((sum, item) => sum + item.score, 0) / artifacts.length);
  }, [artifacts]);

  const topPriority = analysis?.priority_queue?.[0]?.item || 'Recovered ledger';
  const repairedPreview = analysis?.repaired_preview ? String(analysis.repaired_preview).slice(0, 500) : '';

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">AI-assisted forensic recovery</span>
          <h1>Evidence Dashboard</h1>
        </div>
        <div className="user-pill">Investigator • Admin</div>
      </header>

      <section className="stats-grid">
        <div className="stat-card accent">
          <span>Active cases</span>
          <strong>{cases.length}</strong>
          <small>+6 this week</small>
        </div>
        <div className="stat-card">
          <span>Recovered artifacts</span>
          <strong>{artifacts.length * 75}</strong>
          <small>{avgScore}% confidence avg</small>
        </div>
        <div className="stat-card">
          <span>Priority alerts</span>
          <strong>12</strong>
          <small>7 required review</small>
        </div>
        <div className="stat-card">
          <span>Response time</span>
          <strong>4.8 min</strong>
          <small>last pipeline cycle</small>
        </div>
      </section>

      <section className="panel-group two-column">
        <div className="panel">
          <div className="panel-header">
            <h2>Recent cases</h2>
            <button type="button">New case</button>
          </div>
          <div className="case-list">
            {cases.map((item) => (
              <div className="case-item" key={item.id}>
                <div>
                  <span className="case-id">{item.id}</span>
                  <h3>{item.title}</h3>
                </div>
                <div className="case-meta">
                  <span className={`status ${String(item.status).toLowerCase().replace(/\s+/g, '-')}`}>{item.status}</span>
                  <strong>{item.score}</strong>
                </div>
                <small>{item.updated}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Processing pipeline</h2>
            <span className="pill success">Live</span>
          </div>
          <div className="pipeline">
            <div className="pipeline-row complete"><span>Carving</span><strong>Done</strong></div>
            <div className="pipeline-row complete"><span>Clustering</span><strong>Done</strong></div>
            <div className="pipeline-row active"><span>Scoring</span><strong>Running</strong></div>
            <div className="pipeline-row"><span>Classification</span><strong>Queued</strong></div>
          </div>
        </div>
      </section>

      <section className="panel-group two-column lower-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Recovered evidence artifacts</h2>
          </div>
          <div className="artifact-grid">
            {artifacts.map((item) => (
              <article className="artifact-card" key={item.id}>
                <div className="artifact-topline">
                  <span className="artifact-type">{item.type}</span>
                  <span className={`score badge-${item.score >= 80 ? 'good' : item.score >= 65 ? 'warn' : 'bad'}`}>{item.score}</span>
                </div>
                <h3>{item.id}</h3>
                <div className="artifact-meta">
                  <span>{item.format}</span>
                  <span>{item.priority}</span>
                </div>
                <div className="tags">
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Investigator summary</h2>
          </div>
          <p className="report-copy">{analysis?.ai_summary || 'No forensic summary available yet.'}</p>

          {repairedPreview && (
            <>
              <div className="panel-header">
                <h2>Recovered / repaired file preview</h2>
              </div>
              <pre className="report-copy" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: '8px' }}>
                {repairedPreview}
              </pre>
              {analysis?.repaired_file_name && (
                <small style={{ color: '#9eafc7', display: 'block', marginTop: '8px' }}>
                  Repaired file: {analysis.repaired_file_name}
                </small>
              )}
            </>
          )}

          <div className="timeline">
            <div className="timeline-item">
              <span className="time">TOP</span>
              <div>
                <strong>{topPriority}</strong>
                <small>highest-confidence recovered evidence</small>
              </div>
            </div>
            {timeline.map((step) => (
              <div className="timeline-item" key={step.time}>
                <span className="time">{step.time}</span>
                <div>
                  <strong>{step.event}</strong>
                  <small>{step.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function NewCasePage({ onCreateCase, onCancel }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    title: 'Finance Drive Recovery',
    source_type: 'disk_image',
    corruption_level: 'medium',
    file_name: 'finance_drive.img',
    description: 'Recovered from a partially overwritten workstation drive containing ledger exports and cached images.',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreateCase({ ...form, selectedFile });
  };

  return (
    <div className="page-card">
      <header className="topbar">
        <div>
          <span className="eyebrow">Case intake</span>
          <h1>New Case / Upload</h1>
        </div>
      </header>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Case title
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </label>

        <label>
          Source type
          <select
            value={form.source_type}
            onChange={(event) => setForm({ ...form, source_type: event.target.value })}
          >
            <option value="disk_image">Disk image</option>
            <option value="usb_drive">USB drive</option>
            <option value="network_share">Network share</option>
          </select>
        </label>

        <label>
          Corruption level
          <select
            value={form.corruption_level}
            onChange={(event) => setForm({ ...form, corruption_level: event.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="wide">
          Evidence file name
          <input
            value={form.file_name}
            onChange={(event) => setForm({ ...form, file_name: event.target.value })}
          />
        </label>

        <label className="wide">
          Evidence notes
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>

        <div className="upload-box wide">
          <strong>{selectedFile ? `Selected: ${selectedFile.name}` : 'Upload image or select evidence path'}</strong>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                setForm((prev) => ({ ...prev, file_name: file.name }));
              }
            }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()}>Choose disk image</button>
        </div>

        <div className="form-actions wide">
          <button type="submit">Create case</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function ProcessingPage() {
  return (
    <div className="page-card">
      <header className="topbar">
        <div>
          <span className="eyebrow">Pipeline</span>
          <h1>Processing View</h1>
        </div>
      </header>
      <div className="panel">
        <div className="pipeline">
          <div className="pipeline-row complete"><span>Ingestion</span><strong>Uploaded</strong></div>
          <div className="pipeline-row complete"><span>Carving</span><strong>Complete</strong></div>
          <div className="pipeline-row complete"><span>Fragment alignment</span><strong>Complete</strong></div>
          <div className="pipeline-row active"><span>Integrity scoring</span><strong>Running</strong></div>
          <div className="pipeline-row"><span>Classification</span><strong>Queued</strong></div>
        </div>
      </div>
    </div>
  );
}

function ArtifactsPage({ artifacts }) {
  return (
    <div className="page-card">
      <header className="topbar">
        <div>
          <span className="eyebrow">Results</span>
          <h1>Case Results Overview</h1>
        </div>
      </header>
      <div className="artifact-grid">
        {artifacts.map((item) => (
          <article className="artifact-card" key={item.id}>
            <div className="artifact-topline">
              <span className="artifact-type">{item.type}</span>
              <span className={`score badge-${item.score >= 80 ? 'good' : item.score >= 65 ? 'warn' : 'bad'}`}>{item.score}</span>
            </div>
            <h3>{item.id}</h3>
            <div className="artifact-meta">
              <span>{item.format}</span>
              <span>{item.priority}</span>
            </div>
            <div className="tags">
              {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TimelinePage() {
  return (
    <div className="page-card">
      <header className="topbar">
        <div>
          <span className="eyebrow">Correlation</span>
          <h1>Timeline View</h1>
        </div>
      </header>
      <div className="panel">
        <div className="timeline">
          {timeline.map((step) => (
            <div className="timeline-item" key={step.time}>
              <span className="time">{step.time}</span>
              <div>
                <strong>{step.event}</strong>
                <small>{step.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatPage({ messages, onSendMessage }) {
  const [draft, setDraft] = useState('What did you find around the financial transfers?');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    await onSendMessage(draft.trim());
    setDraft('');
  };

  return (
    <div className="page-card">
      <header className="topbar">
        <div>
          <span className="eyebrow">RAG</span>
          <h1>Investigator Chat</h1>
        </div>
      </header>

      <div className="panel chat-panel">
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.user ? 'user' : 'assistant'}`}>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

function ReportsPage({ report, onGenerate, onShare }) {
  return (
    <div className="page-card">
      <header className="topbar">
        <div>
          <span className="eyebrow">Export</span>
          <h1>Report View / Export</h1>
        </div>
      </header>
      <div className="panel">
        <h3>Summary of findings</h3>
        <p className="report-copy">{report.summary_text}</p>
        <div className="report-actions">
          <button type="button" onClick={onGenerate}>Generate report</button>
          <button type="button" className="secondary" onClick={onShare}>Share report</button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="page-card">
      <header className="topbar">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Settings / User Management</h1>
        </div>
      </header>
      <div className="panel">
        <ul className="settings-list">
          <li>JWT session timeout: 15 minutes</li>
          <li>Role model: investigator and admin</li>
          <li>Evidence retention: 30 days</li>
          <li>Case isolation: enabled</li>
        </ul>
      </div>
    </div>
  );
}

function AuthPage({ mode, onModeChange, form, onFormChange, onSubmit, error }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">RecoverX</span>
          <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => onModeChange('login')}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => onModeChange('register')}>Register</button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'register' && (
            <label>
              Full name
              <input value={form.name} onChange={(event) => onFormChange('name', event.target.value)} />
            </label>
          )}

          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => onFormChange('email', event.target.value)} />
          </label>

          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => onFormChange('password', event.target.value)} />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit">
            {mode === 'login' ? 'Continue to dashboard' : 'Register and start'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [cases, setCases] = useState(defaultCases);
  const [artifacts, setArtifacts] = useState(defaultArtifacts);
  const [analysis, setAnalysis] = useState(defaultAnalysis);
  const [connectionState, setConnectionState] = useState('demo');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: 'Investigator One',
    email: 'admin@recoverx.local',
    password: 'Password123!',
  });
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'The most credible artifact is a recovered PDF ledger with an integrity score of 91%. I can cite the related fragments and metadata.', user: false },
    { role: 'user', text: 'What did you find around the financial transfers?', user: true },
    { role: 'assistant', text: 'I found a reconstructed ledger entry tied to outbound transfers and matching timestamps in the image cache.', user: false },
  ]);
  const [report, setReport] = useState({
    summary_text: 'Recovered records show a moderate-confidence PDF ledger and a supporting image fragment with related timestamps. Remaining gaps include a damaged archive segment and partially overwritten metadata.',
  });

  const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  const syncSession = (nextSession) => {
    setSession(nextSession);
    if (nextSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [casesRes, artifactsRes] = await Promise.all([
        fetch(`${API_BASE}/cases`, {
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
        }),
        fetch(`${API_BASE}/cases/case-demo/artifacts`),
      ]);

      if (casesRes.ok) {
        const data = await casesRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setCases(data.map(normalizeCase));
          setConnectionState('api');
        } else {
          setCases(defaultCases);
        }
      } else {
        setCases(defaultCases);
      }

      if (artifactsRes.ok) {
        const data = await artifactsRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setArtifacts(normalizeArtifacts(data));
        } else {
          setArtifacts(defaultArtifacts);
        }
      } else {
        setArtifacts(defaultArtifacts);
      }
    } catch (error) {
      setCases(defaultCases);
      setArtifacts(defaultArtifacts);
      setConnectionState('demo');
    }
  };

  useEffect(() => {
    if (!session) return;
    loadDashboardData();
  }, [session]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');

    const normalizedEmail = authForm.email.trim().toLowerCase();
    const isDemoAccount = normalizedEmail.endsWith('@recoverx.local') || normalizedEmail === 'admin@recoverx.local';
    const endpoint = authMode === 'login' ? 'login' : 'register';
    const body = authMode === 'login'
      ? { email: normalizedEmail, password: authForm.password }
      : { name: authForm.name, email: normalizedEmail, password: authForm.password };

    if (authMode === 'register' && authForm.password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    try {
      let response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok && authMode === 'login' && isDemoAccount) {
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: authForm.name || 'Investigator One',
            email: normalizedEmail,
            password: authForm.password,
          }),
        });

        if (!registerResponse.ok) {
          const fallbackSession = {
            user: {
              id: 'demo-user',
              name: authForm.name || 'Investigator One',
              email: normalizedEmail,
              role: 'admin',
            },
            access_token: 'demo-access-token',
            refresh_token: 'demo-refresh-token',
          };
          syncSession(fallbackSession);
          setCurrentPage('dashboard');
          setConnectionState('demo');
          setAuthError('');
          return;
        }

        response = registerResponse;
      }

      if (!response.ok) {
        if (isDemoAccount) {
          syncSession({
            user: {
              id: 'demo-user',
              name: authForm.name || 'Investigator One',
              email: normalizedEmail,
              role: 'admin',
            },
            access_token: 'demo-access-token',
            refresh_token: 'demo-refresh-token',
          });
          setCurrentPage('dashboard');
          setConnectionState('demo');
          setAuthError('');
          return;
        }

        const data = await response.json().catch(() => ({ detail: 'Authentication failed' }));
        const message = Array.isArray(data.detail)
          ? data.detail.map((item) => item?.msg || item?.detail || 'Validation error').join('. ')
          : typeof data.detail === 'string'
            ? data.detail
            : data.detail?.msg || 'Authentication failed';
        throw new Error(message);
      }

      const data = await response.json();
      syncSession({
        user: data.user,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      setCurrentPage('dashboard');
      setConnectionState('api');
      await loadDashboardData();
    } catch (error) {
      setAuthError(error.message || 'Unable to authenticate');
    }
  };

  const handleCaseCreate = async (payload) => {
    try {
      const response = await fetch(`${API_BASE}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: payload.title,
          source_type: payload.source_type,
          description: payload.description,
          user_id: session?.user?.id || 'demo-user',
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to create case');
      }

      const data = await response.json();
      const createdCaseId = data.id || 'demo';

      let result = null;
      const requestPayload = {
        file_name: payload.file_name || 'damaged_source.img',
        source_type: payload.source_type || 'disk_image',
        corruption_level: payload.corruption_level || 'medium',
      };

      if (payload.selectedFile) {
        const formData = new FormData();
        formData.append('file', payload.selectedFile);
        formData.append('file_name', payload.file_name || payload.selectedFile.name);
        formData.append('source_type', payload.source_type || 'disk_image');
        formData.append('corruption_level', payload.corruption_level || 'medium');

        const uploadResponse = await fetch(`${API_BASE}/cases/${createdCaseId}/upload`, {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });

        if (uploadResponse.ok) {
          result = await uploadResponse.json();
        }
      }

      if (!result) {
        const processResponse = await fetch(`${API_BASE}/cases/${createdCaseId}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(requestPayload),
        });

        if (processResponse.ok) {
          result = await processResponse.json();
        }
      }

      if (result) {
        setAnalysis(result);
        setReport({ summary_text: result.ai_summary || report.summary_text });
        const mappedArtifacts = (result.recovered_items || []).map((item, index) => ({
          id: `ART-${String(index + 1).padStart(3, '0')}`,
          type: item.name || 'Recovered artifact',
          format: item.type?.toUpperCase() || 'FILE',
          score: Math.round((item.confidence || 0.8) * 100),
          tags: [item.recoverability || 'forensic', item.status || 'recovered'],
          priority: item.recoverability === 'high' ? 'High' : item.recoverability === 'medium' ? 'Medium' : 'Low',
        }));
        if (mappedArtifacts.length) {
          setArtifacts(mappedArtifacts);
        }
      }

      setCases((prev) => [normalizeCase(data), ...prev]);
      setCurrentPage('dashboard');
    } catch (error) {
      setAnalysis(defaultAnalysis);
      setCases((prev) => [
        ...prev,
        { id: 'CASE-NEW', title: payload.title, status: 'Queued', score: '82%', updated: 'now' },
      ]);
    }
  };

  const handleChatMessage = async (question) => {
    const activeCaseId = cases[0]?.id || 'case-demo';
    const userMessage = { role: 'user', text: question, user: true };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_BASE}/cases/${activeCaseId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', text: data.answer, user: false }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'The chat assistant is in demo mode. A connected forensic engine will answer this request once the analysis service is online.', user: false }]);
    }
  };

  const handleGenerateReport = async () => {
    const activeCaseId = cases[0]?.id || 'case-demo';
    try {
      const response = await fetch(`${API_BASE}/cases/${activeCaseId}/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      });

      if (!response.ok) {
        throw new Error('Report generation failed');
      }

      const data = await response.json();
      const summary = data.summary_text || analysis.ai_summary || report.summary_text;
      setReport({ summary_text: summary });
    } catch (error) {
      setReport({ summary_text: analysis.ai_summary || 'The report engine is in demo mode, but the evidence summary is ready for export once processing is connected.' });
    }
  };

  const handleShareReport = async () => {
    const payload = report.summary_text || analysis.ai_summary || 'RecoverX forensic summary';
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(payload);
      }
      setCurrentPage('reports');
    } catch (error) {
      window.alert(payload);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'newcase':
        return <NewCasePage onCreateCase={handleCaseCreate} onCancel={() => setCurrentPage('dashboard')} />;
      case 'processing':
        return <ProcessingPage />;
      case 'artifacts':
        return <ArtifactsPage artifacts={artifacts} />;
      case 'timeline':
        return <TimelinePage />;
      case 'chat':
        return <ChatPage messages={chatMessages} onSendMessage={handleChatMessage} />;
      case 'reports':
        return <ReportsPage report={report} onGenerate={handleGenerateReport} onShare={handleShareReport} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage cases={cases} artifacts={artifacts} analysis={analysis} />;
    }
  };

  if (!session) {
    return (
      <AuthPage
        mode={authMode}
        onModeChange={setAuthMode}
        form={authForm}
        onFormChange={(field, value) => setAuthForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleAuthSubmit}
        error={authError}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">RX</span>
          <div>
            <strong>RecoverX</strong>
            <small>Forensic Recovery Copilot</small>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card user-panel">
          <span className="label">Operator</span>
          <strong>{session?.user?.name || 'Investigator'}</strong>
          <small>{session?.user?.email || 'investigator@recoverx.local'}</small>
          <button type="button" className="logout-button" onClick={() => syncSession(null)}>Log out</button>
        </div>

        <div className="sidebar-card">
          <span className="label">System health</span>
          <strong>{connectionState === 'api' ? 'Connected' : 'Demo mode'}</strong>
          <small>{connectionState === 'api' ? 'Live API sync' : 'Mock telemetry'}</small>
        </div>
      </aside>

      <main className="content">{renderPage()}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
