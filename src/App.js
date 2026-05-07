import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────
const API = "http://localhost:5000/api";
const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

// ─── HELPERS ───────────────────────────────────────────────────
function getToken() { return localStorage.getItem("bl_token"); }
function getUser()  { try { return JSON.parse(localStorage.getItem("bl_user")); } catch { return null; } }
function saveAuth(token, user, role) {
  localStorage.setItem("bl_token", token);
  localStorage.setItem("bl_user", JSON.stringify({ ...user, role }));
}
function logout() { localStorage.removeItem("bl_token"); localStorage.removeItem("bl_user"); }

async function api(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── COMPONENTS ────────────────────────────────────────────────

function Badge({ color, children }) {
  const colors = {
    red:    "bg-red-100 text-red-700 border border-red-200",
    green:  "bg-green-100 text-green-700 border border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    blue:   "bg-blue-100 text-blue-700 border border-blue-200",
    gray:   "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>{children}</span>;
}

function StatusBadge({ status }) {
  const map = { Pending:"yellow", Matched:"blue", Fulfilled:"green", Cancelled:"gray", Critical:"red" };
  return <Badge color={map[status] || "gray"}>{status}</Badge>;
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div style={{ width:40, height:40, border:"4px solid #fee2e2", borderTop:"4px solid #dc2626", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );
}

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error:   "bg-red-50 border-red-200 text-red-800",
    info:    "bg-blue-50 border-blue-200 text-blue-800",
  };
  return (
    <div className={`border rounded-xl p-4 mb-4 flex items-start gap-3 ${styles[type] || styles.info}`}>
      <span className="text-lg">{type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
      <p className="flex-1 text-sm">{msg}</p>
      {onClose && <button onClick={onClose} className="text-current opacity-50 hover:opacity-100">✕</button>}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>{children}</div>;
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition" {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white transition" {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, variant = "primary", loading, className = "", ...props }) {
  const base = "px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary:  "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    secondary:"bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    green:    "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    ghost:    "text-red-600 hover:bg-red-50",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading && <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTop:"2px solid white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />}
      {children}
    </button>
  );
}

// ─── COUNTDOWN TIMER ────────────────────────────────────────────
function Countdown({ expiresAt }) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  const pct = Math.max(0, (left / 900) * 100);
  const color = left < 120 ? "#dc2626" : left < 300 ? "#f59e0b" : "#16a34a";

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ position:"relative", width:64, height:64 }}>
        <svg width={64} height={64} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={32} cy={32} r={28} fill="none" stroke="#f3f4f6" strokeWidth={5} />
          <circle cx={32} cy={32} r={28} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${2*Math.PI*28}`}
            strokeDashoffset={`${2*Math.PI*28*(1-pct/100)}`}
            style={{ transition:"stroke-dashoffset 1s linear" }} />
        </svg>
        <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color }}>
          {m}:{s}
        </span>
      </div>
      <span className="text-xs text-gray-500">expires</span>
    </div>
  );
}

// ─── STATS BAR ──────────────────────────────────────────────────
function StatsBar({ stats }) {
  const items = [
    { icon:"🩸", label:"Donors",    value: stats.totalDonors },
    { icon:"💚", label:"Available", value: stats.availableDonors },
    { icon:"📋", label:"Requests",  value: stats.totalRequests },
    { icon:"✅", label:"Fulfilled", value: stats.fulfilledRequests },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {items.map(({ icon, label, value }) => (
        <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl mb-1">{icon}</div>
          <div className="text-2xl font-bold text-gray-800">{value ?? "—"}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── AUTH FORMS ─────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [tab, setTab]       = useState("login");       // login | donor | recipient
  const [role, setRole]     = useState("donor");
  const [form, setForm]     = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert]   = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocLoading(false);
      },
      () => { setAlert({ type:"error", msg:"Location access denied. Please enter manually or enable GPS." }); setLocLoading(false); }
    );
  };

  const handleLogin = async () => {
    setLoading(true); setAlert(null);
    try {
      const data = await api(`/${role}s/login`, { method:"POST", body: { email: form.email, password: form.password } });
      saveAuth(data.token, data[role] || data.donor || data.recipient, role);
      onLogin(role, data[role] || data.donor || data.recipient);
    } catch (e) { setAlert({ type:"error", msg: e.message }); }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true); setAlert(null);
    try {
      const endpoint = tab === "donor" ? "/donors/register" : "/recipients/register";
      await api(endpoint, { method:"POST", body: form });
      setAlert({ type:"success", msg:"Registration successful! Please log in." });
      setTab("login");
    } catch (e) { setAlert({ type:"error", msg: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#fff1f2 0%,#fff 50%,#fef2f2 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:440 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div style={{ width:72, height:72, background:"linear-gradient(135deg,#dc2626,#991b1b)", borderRadius:24, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 12px 40px rgba(220,38,38,0.3)" }}>
            <span style={{ fontSize:36 }}>🩸</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, color:"#111827", fontFamily:"Georgia,serif" }}>BloodLink</h1>
          <p className="text-gray-500 text-sm mt-1">Connecting donors to those who need them most</p>
        </div>

        <Card>
          {/* Tab nav */}
          <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-xl">
            {[["login","Login"],["donor","Donor Sign-up"],["recipient","Recipient Sign-up"]].map(([t,l]) => (
              <button key={t} onClick={() => { setTab(t); setForm({}); setAlert(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${tab===t ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}>
                {l}
              </button>
            ))}
          </div>

          <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

          {tab === "login" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                {["donor","recipient"].map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${role===r ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-600 hover:border-red-300"}`}>
                    {r === "donor" ? "🩸 Donor" : "🏥 Recipient"}
                  </button>
                ))}
              </div>
              <Input label="Email" type="email" placeholder="you@example.com" value={form.email||""} onChange={set("email")} />
              <Input label="Password" type="password" placeholder="••••••••" value={form.password||""} onChange={set("password")} />
              <Btn loading={loading} onClick={handleLogin} className="w-full mt-2">Login as {role}</Btn>
            </div>
          )}

          {(tab === "donor" || tab === "recipient") && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name" placeholder="John Doe" value={form.fullName||""} onChange={set("fullName")} />
                <Input label="Phone" type="tel" placeholder="+92 300 0000000" value={form.phone||""} onChange={set("phone")} />
              </div>
              <Input label="Email" type="email" placeholder="you@example.com" value={form.email||""} onChange={set("email")} />
              <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password||""} onChange={set("password")} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Blood Group" value={form.bloodGroup||""} onChange={set("bloodGroup")}
                  options={[{value:"",label:"Select..."},...BLOOD_GROUPS.map(g=>({value:g,label:g}))]} />
                <Input label="City" placeholder="Karachi" value={form.city||""} onChange={set("city")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Location</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input placeholder="Latitude" type="number" value={form.latitude||""} onChange={set("latitude")} />
                  <Input placeholder="Longitude" type="number" value={form.longitude||""} onChange={set("longitude")} />
                </div>
                <Btn variant="secondary" loading={locLoading} onClick={getLocation} className="w-full text-xs">
                  📍 Use My Location
                </Btn>
              </div>
              <Btn loading={loading} onClick={handleRegister} className="w-full">
                Register as {tab === "donor" ? "Donor" : "Recipient"}
              </Btn>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── DONOR DASHBOARD ────────────────────────────────────────────
function DonorDashboard({ user, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory]             = useState([]);
  const [available, setAvailable]         = useState(user.IsAvailable ?? user.isAvailable ?? true);
  const [loading, setLoading]             = useState(false);
  const [alert, setAlert]                 = useState(null);
  const [tab, setTab]                     = useState("notifications");
  const [respondingId, setRespondingId]   = useState(null);
  const [eta, setEta]                     = useState(30);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api(`/notifications/donor/${user.DonorID || user.donorId}`);
      setNotifications(data);
    } catch {}
  }, [user]);

  const fetchHistory = useCallback(async () => {
    try { setHistory(await api("/donors/history")); } catch {}
  }, []);

  useEffect(() => { fetchNotifications(); fetchHistory(); }, [fetchNotifications, fetchHistory]);
  useEffect(() => { const id = setInterval(fetchNotifications, 30000); return () => clearInterval(id); }, [fetchNotifications]);

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      await api("/donors/availability", { method:"PUT", body:{ isAvailable: !available } });
      setAvailable(v => !v);
    } catch (e) { setAlert({ type:"error", msg:e.message }); }
    setLoading(false);
  };

  const respond = async (notif, action) => {
    setLoading(true);
    try {
      const data = await api("/respond", { method:"POST", body:{ notificationId: notif.NotificationID, action, estimatedMinutes: eta } });
      setAlert({ type:"success", msg: action === "accept" ? `✅ Accepted! ETA ${eta} min sent to recipient.` : "Declined." });
      fetchNotifications();
    } catch (e) { setAlert({ type:"error", msg:e.message }); }
    setRespondingId(null);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)", color:"white", padding:"20px 24px" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div style={{ width:44, height:44, background:"rgba(255,255,255,0.2)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🩸</div>
            <div>
              <p className="text-red-100 text-xs">Donor Dashboard</p>
              <h2 className="font-bold text-lg">{user.FullName || user.fullName}</h2>
            </div>
          </div>
          <button onClick={onLogout} className="text-red-200 hover:text-white text-sm">Logout</button>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, padding:"4px 12px", fontSize:14, fontWeight:700 }}>
            {user.BloodGroup || user.bloodGroup}
          </span>
          <button onClick={toggleAvailability} disabled={loading}
            style={{ background: available ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.15)",
                     border: available ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(255,255,255,0.3)",
                     color:"white", borderRadius:99, padding:"4px 14px", fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>
            {available ? "🟢 Available" : "⛔ Unavailable"}
          </button>
          {notifications.length > 0 && (
            <span style={{ background:"#f59e0b", borderRadius:99, padding:"2px 10px", fontSize:12, fontWeight:700 }}>
              {notifications.length} pending
            </span>
          )}
        </div>
      </div>

      <div style={{ padding:16, maxWidth:600, margin:"0 auto" }}>
        <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-4 shadow-sm">
          {[["notifications","🔔 Requests"],["history","📋 History"]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab===t ? "bg-red-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {l} {t==="notifications" && notifications.length > 0 && <span className="ml-1 bg-yellow-400 text-yellow-900 rounded-full px-1.5 py-0.5 text-xs">{notifications.length}</span>}
            </button>
          ))}
        </div>

        {tab === "notifications" && (
          <div className="flex flex-col gap-4">
            {notifications.length === 0 ? (
              <Card className="text-center">
                <div className="text-5xl mb-3">💤</div>
                <p className="text-gray-500">No pending blood requests near you right now.</p>
                <p className="text-xs text-gray-400 mt-1">Stay available to help when needed!</p>
              </Card>
            ) : notifications.map(n => (
              <Card key={n.NotificationID}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize:24, fontWeight:800, color:"#dc2626" }}>{n.BloodGroup}</span>
                      <StatusBadge status={n.Urgency} />
                    </div>
                    <p className="font-semibold text-gray-800">{n.HospitalName}</p>
                    <p className="text-sm text-gray-500">📍 {n.City} • {n.UnitsNeeded} unit{n.UnitsNeeded>1?"s":""}</p>
                    <p className="text-sm text-gray-500">👤 Patient: {n.RecipientName}</p>
                  </div>
                  <Countdown expiresAt={n.ExpiresAt} />
                </div>

                {respondingId === n.NotificationID ? (
                  <div className="mt-3 p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-sm font-medium text-green-800 mb-3">How many minutes to reach hospital?</p>
                    <input type="range" min={5} max={120} step={5} value={eta} onChange={e => setEta(+e.target.value)}
                      className="w-full mb-2" style={{ accentColor:"#16a34a" }} />
                    <p className="text-center text-green-700 font-bold mb-3">⏱️ {eta} minutes</p>
                    <div className="flex gap-2">
                      <Btn variant="green" loading={loading} onClick={() => respond(n, "accept")} className="flex-1">Confirm Acceptance</Btn>
                      <Btn variant="secondary" onClick={() => setRespondingId(null)} className="flex-1">Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <Btn variant="green" onClick={() => setRespondingId(n.NotificationID)} className="flex-1">✅ Accept & Set ETA</Btn>
                    <Btn variant="secondary" loading={loading} onClick={() => respond(n, "decline")} className="flex-1">❌ Decline</Btn>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="flex flex-col gap-3">
            {history.length === 0 ? (
              <Card className="text-center">
                <div className="text-5xl mb-3">🎖️</div>
                <p className="text-gray-500">No donations yet. Be the first to help!</p>
              </Card>
            ) : history.map(h => (
              <Card key={h.HistoryID}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{h.HospitalName}</p>
                    <p className="text-sm text-gray-500">Recipient: {h.RecipientName} • {h.BloodGroup}</p>
                    <p className="text-sm text-gray-500">{new Date(h.DonatedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge color="green">{h.UnitsGiven} unit{h.UnitsGiven>1?"s":""}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RECIPIENT DASHBOARD ─────────────────────────────────────────
function RecipientDashboard({ user, onLogout }) {
  const [tab, setTab]       = useState("request");
  const [requests, setRequests] = useState([]);
  const [stats, setStats]   = useState({});
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [form, setForm]     = useState({
    bloodGroup: user.BloodGroup || "A+",
    unitsNeeded: 1,
    hospitalName: "",
    city: user.City || "",
    latitude: user.Latitude || 0,
    longitude: user.Longitude || 0,
    urgency: "Urgent",
    notes: "",
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === "number" ? +e.target.value : e.target.value }));

  const fetchRequests = useCallback(async () => {
    try { setRequests(await api("/requests")); } catch {}
  }, []);

  useEffect(() => {
    fetchRequests();
    api("/stats").then(setStats).catch(() => {});
  }, [fetchRequests]);

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      p => { setForm(f => ({ ...f, latitude: p.coords.latitude, longitude: p.coords.longitude })); setLocLoading(false); },
      () => { setAlert({ type:"error", msg:"Location denied." }); setLocLoading(false); }
    );
  };

  const submitRequest = async () => {
    if (!form.hospitalName || !form.city) return setAlert({ type:"error", msg:"Please fill hospital name and city." });
    setLoading(true); setAlert(null);
    try {
      const data = await api("/requests", { method:"POST", body: form });
      setAlert({ type:"success", msg: `Request sent! ${data.donorsNotified} donors notified nearby.` });
      fetchRequests();
      setTab("myRequests");
    } catch (e) { setAlert({ type:"error", msg: e.message }); }
    setLoading(false);
  };

  const fulfill = async (requestId) => {
    setLoading(true);
    try {
      await api(`/requests/${requestId}/fulfill`, { method:"POST", body:{ units:1 } });
      setAlert({ type:"success", msg:"Donation marked as fulfilled. Thank you!" });
      fetchRequests();
    } catch (e) { setAlert({ type:"error", msg:e.message }); }
    setLoading(false);
  };

  const myRequests = requests.filter(r => r.RecipientID === (user.RecipientID || user.recipientId));

  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1d4ed8,#1e3a8a)", color:"white", padding:"20px 24px" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div style={{ width:44, height:44, background:"rgba(255,255,255,0.2)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏥</div>
            <div>
              <p className="text-blue-200 text-xs">Recipient Dashboard</p>
              <h2 className="font-bold text-lg">{user.FullName || user.fullName}</h2>
            </div>
          </div>
          <button onClick={onLogout} className="text-blue-200 hover:text-white text-sm">Logout</button>
        </div>
        <StatsBar stats={stats} />
      </div>

      <div style={{ padding:16, maxWidth:600, margin:"0 auto" }}>
        <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-4 shadow-sm">
          {[["request","🩸 New Request"],["myRequests","📋 My Requests"]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab===t ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === "request" && (
          <Card>
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Request Blood</h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Select label="Blood Group Needed" value={form.bloodGroup} onChange={set("bloodGroup")}
                  options={BLOOD_GROUPS.map(g => ({ value:g, label:g }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units Needed</label>
                  <input type="number" min={1} max={10} value={form.unitsNeeded} onChange={set("unitsNeeded")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <Input label="Hospital Name" placeholder="Aga Khan Hospital" value={form.hospitalName} onChange={set("hospitalName")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" placeholder="Karachi" value={form.city} onChange={set("city")} />
                <Select label="Urgency" value={form.urgency} onChange={set("urgency")}
                  options={[{value:"Critical",label:"🚨 Critical"},{value:"Urgent",label:"⚠️ Urgent"},{value:"Normal",label:"ℹ️ Normal"}]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Location (for matching)</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input placeholder="Latitude" type="number" value={form.latitude} onChange={set("latitude")} />
                  <Input placeholder="Longitude" type="number" value={form.longitude} onChange={set("longitude")} />
                </div>
                <Btn variant="secondary" loading={locLoading} onClick={getLocation} className="w-full text-xs mb-3">
                  📍 Use My GPS Location
                </Btn>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special requirements or context..."
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
              <Btn loading={loading} onClick={submitRequest} className="w-full" style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }}>
                🩸 Find Donors Now
              </Btn>
            </div>
          </Card>
        )}

        {tab === "myRequests" && (
          <div className="flex flex-col gap-4">
            {myRequests.length === 0 ? (
              <Card className="text-center">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-gray-500">No requests yet. Submit your first request!</p>
              </Card>
            ) : myRequests.map(r => (
              <Card key={r.RequestID}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize:22, fontWeight:800, color:"#dc2626" }}>{r.BloodGroup}</span>
                      <StatusBadge status={r.Status} />
                      <StatusBadge status={r.Urgency} />
                    </div>
                    <p className="font-semibold text-gray-800">{r.HospitalName}</p>
                    <p className="text-sm text-gray-500">📍 {r.City} • {r.UnitsNeeded} unit{r.UnitsNeeded>1?"s":""}</p>
                    <p className="text-xs text-gray-400">{new Date(r.CreatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {r.Status === "Matched" && r.DonorName && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                    <p className="text-green-800 font-semibold text-sm">🎉 Donor on the way!</p>
                    <p className="text-green-700 text-sm">👤 {r.DonorName}</p>
                    <p className="text-green-700 text-sm">📞 {r.DonorPhone}</p>
                    <Btn variant="green" loading={loading} onClick={() => fulfill(r.RequestID)} className="mt-2 w-full text-sm">
                      ✅ Mark as Donated
                    </Btn>
                  </div>
                )}
                {r.Status === "Fulfilled" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-blue-800 font-semibold text-sm">✅ Donation Complete</p>
                    <p className="text-blue-600 text-sm">Donated by: {r.DonorName}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT APP ───────────────────────────────────────────────────
export default function App() {
  const [user, setUser]   = useState(getUser);
  const [role, setRole]   = useState(() => getUser()?.role || null);

  const handleLogin = (r, u) => { setRole(r); setUser({ ...u, role: r }); };
  const handleLogout = () => { logout(); setUser(null); setRole(null); };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {!user && <AuthPage onLogin={handleLogin} />}
      {user && role === "donor"     && <DonorDashboard     user={user} onLogout={handleLogout} />}
      {user && role === "recipient" && <RecipientDashboard user={user} onLogout={handleLogout} />}
    </>
  );
}
