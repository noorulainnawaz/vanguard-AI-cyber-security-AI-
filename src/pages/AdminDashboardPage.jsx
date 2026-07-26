import { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";

const API_URL = "https://vanguard-ai.fastapicloud.dev";

export default function AdminDashboardPage({ adminToken, onAdminLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview"); // overview | users | orgs

  const [activityUser, setActivityUser] = useState(null); // { id, name } of user being viewed
  const [activityData, setActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const [messageUser, setMessageUser] = useState(null); // { id, name }
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const headers = { Authorization: `Bearer ${adminToken}` };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, usersRes, orgsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/organizations`, { headers }),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        onAdminLogout();
        return;
      }

      setStats(await statsRes.json());
      setUsers((await usersRes.json()).users || []);
      setOrgs((await orgsRes.json()).organizations || []);
    } catch (err) {
      setError("Failed to load admin data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    loadAll();
  }

  async function deleteUser(userId) {
    if (!confirm("Delete this user permanently? This cannot be undone.")) return;
    await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers,
    });
    loadAll();
  }

  async function openActivity(user) {
    setActivityUser(user);
    setActivityData(null);
    setActivityLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${user.id}/activity`, { headers });
      const data = await res.json();
      setActivityData(data);
    } catch (err) {
      setActivityData({ activity_feed: [] });
    } finally {
      setActivityLoading(false);
    }
  }

  function openMessage(user) {
    setMessageUser(user);
    setMessageText("");
  }

  async function sendMessage() {
    if (!messageText.trim()) return;
    setSendingMessage(true);
    try {
      await fetch(`${API_URL}/admin/messages`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: messageUser.id, message: messageText }),
      });
      setMessageUser(null);
      setMessageText("");
    } catch (err) {
      alert("Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="flex bg-bg min-h-screen">
        <div className="w-60 min-h-screen bg-charcoal" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-bg min-h-screen">
      <AdminSidebar activeTab={tab} onTabChange={setTab} onAdminLogout={onAdminLogout} />

      <div className="flex-1 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-charcoal capitalize">
            {tab === "overview" ? "Admin Overview" : tab === "users" ? "Manage Users" : "Organizations"}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>
        )}

        {tab === "overview" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.total_users} />
            <StatCard label="Organizations" value={stats.total_organizations} />
            <StatCard label="Reports Generated" value={stats.total_reports} />
            <StatCard label="Attack Stories" value={stats.total_attack_stories} />
            <StatCard label="Chat Messages" value={stats.total_chat_messages} />
            <StatCard label="Avg Identity Risk" value={stats.average_identity_risk ?? "N/A"} />
            <StatCard label="Avg Human Risk" value={stats.average_human_risk ?? "N/A"} />
            <StatCard label="Avg Insider Threat" value={stats.average_insider_threat ?? "N/A"} />
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white border border-emerald-pale rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-emerald-pale/40 text-charcoal-soft text-left">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Org</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-emerald-pale">
                    <td className="px-5 py-3 text-charcoal font-medium">{u.name}</td>
                    <td className="px-5 py-3 text-slate">{u.email}</td>
                    <td className="px-5 py-3 text-slate">{u.org_name || "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${u.role === "admin" ? "bg-gold text-white" : "bg-emerald-pale text-emerald"
                          }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openActivity(u)} className="text-xs font-bold text-emerald hover:underline">
                        View Activity
                      </button>
                      <button onClick={() => openMessage(u)} className="text-xs font-bold text-charcoal-soft hover:underline">
                        Message
                      </button>
                      <button onClick={() => toggleRole(u.id, u.role)} className="text-xs font-bold text-gold hover:underline">
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button onClick={() => deleteUser(u.id)} className="text-xs font-bold text-red-500 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-slate">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "orgs" && (
          <div className="bg-white border border-emerald-pale rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-emerald-pale/40 text-charcoal-soft text-left">
                <tr>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Industry</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Users</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-t border-emerald-pale">
                    <td className="px-5 py-3 text-charcoal font-medium">{o.name}</td>
                    <td className="px-5 py-3 text-slate">{o.industry}</td>
                    <td className="px-5 py-3 text-slate">{o.size}</td>
                    <td className="px-5 py-3 text-slate">{o.user_count}</td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-slate">
                      No organizations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- Activity Modal ---------------- */}
      {activityUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-display text-lg text-charcoal">Activity — {activityUser.name}</h2>
                <p className="text-xs text-slate">{activityUser.email}</p>
              </div>
              <button onClick={() => setActivityUser(null)} className="text-slate hover:text-charcoal text-lg leading-none">
                ✕
              </button>
            </div>

            {activityLoading && <p className="text-sm text-slate">Loading activity...</p>}

            {!activityLoading && activityData && (
              <div className="space-y-3">
                {activityData.activity_feed.length === 0 && (
                  <p className="text-sm text-slate">No activity recorded for this user yet.</p>
                )}
                {activityData.activity_feed.map((item, i) => (
                  <div key={i} className="border-l-2 border-emerald pl-3 py-1">
                    <p className="text-xs font-bold text-emerald">{item.type}</p>
                    <p className="text-sm text-charcoal-soft break-words">{item.detail}</p>
                    <p className="text-[10px] text-slate mt-0.5">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Send Message Modal ---------------- */}
      {messageUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-display text-lg text-charcoal">Message — {messageUser.name}</h2>
              <button onClick={() => setMessageUser(null)} className="text-slate hover:text-charcoal text-lg leading-none">
                ✕
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              placeholder="Type a message or notification for this user..."
              className="w-full border border-black/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-pale focus:border-emerald resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={sendingMessage}
              className="mt-4 w-full bg-emerald text-white font-bold py-2.5 rounded-lg disabled:opacity-60"
            >
              {sendingMessage ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-emerald-pale rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-slate">{label}</p>
      <p className="font-display text-3xl font-semibold text-emerald mt-1">{value}</p>
    </div>
  );
}