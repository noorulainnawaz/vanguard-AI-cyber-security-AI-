import { useState, useEffect, useRef } from "react";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function ProfilePage({ onLogout }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setError("Could not load profile.");
    }
  }

  async function handlePictureChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/me/upload-picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setUser((prev) => ({ ...prev, profile_picture_url: data.profile_picture_url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-md mx-auto bg-white border border-emerald-pale rounded-2xl p-6">
        <h1 className="font-display text-2xl text-charcoal mb-4">Profile & Settings</h1>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {user ? (
          <>
            <div className="flex flex-col items-center mb-6">
              <div
                onClick={() => fileInputRef.current.click()}
                className="w-24 h-24 rounded-full bg-emerald-pale overflow-hidden cursor-pointer border-2 border-emerald flex items-center justify-center"
              >
                {user.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-emerald font-bold">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePictureChange}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="text-xs text-emerald font-medium mt-2"
              >
                {uploading ? "Uploading..." : "Change photo"}
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div><span className="text-slate">Name:</span> <span className="text-charcoal font-medium">{user.name}</span></div>
              <div><span className="text-slate">Username:</span> <span className="text-charcoal font-medium">{user.username}</span></div>
              <div><span className="text-slate">Email:</span> <span className="text-charcoal font-medium">{user.email}</span></div>
              <div><span className="text-slate">Phone:</span> <span className="text-charcoal font-medium">{user.phone}</span></div>
              <div><span className="text-slate">CNIC:</span> <span className="text-charcoal font-medium">{user.cnic}</span></div>
              <div><span className="text-slate">User ID:</span> <span className="text-charcoal font-medium">{user.user_id}</span></div>
              <div><span className="text-slate">Registration No:</span> <span className="text-charcoal font-medium">{user.reg_number}</span></div>
            </div>
          </>
        ) : (
          !error && <p className="text-slate text-sm">Loading...</p>
        )}

        <button
          onClick={onLogout}
          className="mt-6 w-full bg-charcoal text-white py-2 rounded-xl font-medium hover:bg-charcoal-soft transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}