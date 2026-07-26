import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function AttackSurfacePage() {
  const token = localStorage.getItem("token");
  const [assets, setAssets] = useState([{ asset_name: "", exposure_level: "Medium", asset_type: "Domain" }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function updateAsset(index, field, value) {
    setAssets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addAsset() {
    setAssets((prev) => [...prev, { asset_name: "", exposure_level: "Medium", asset_type: "Domain" }]);
  }

  function removeAsset(index) {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/attack-surface`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ org_id: 1, assets }),
      });
      setResult(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const colorMap = { green: "bg-emerald", yellow: "bg-gold", orange: "bg-orange-500", red: "bg-red-600" };

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="font-display text-2xl text-charcoal mb-6">Attack Surface Visualizer</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-4 mb-6">
          {assets.map((asset, i) => (
            <div key={i} className="flex gap-2 items-end border-b border-emerald-pale pb-3">
              <div className="flex-1">
                <label className="block text-xs text-charcoal mb-1">Asset Name</label>
                <input type="text" value={asset.asset_name}
                  onChange={(e) => updateAsset(i, "asset_name", e.target.value)}
                  className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. app.company.com" required />
              </div>
              <div>
                <label className="block text-xs text-charcoal mb-1">Type</label>
                <select value={asset.asset_type} onChange={(e) => updateAsset(i, "asset_type", e.target.value)}
                  className="border border-emerald-pale rounded-lg px-2 py-2 text-sm">
                  <option>Domain</option><option>Server</option><option>Cloud Service</option><option>API</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-charcoal mb-1">Exposure</label>
                <select value={asset.exposure_level} onChange={(e) => updateAsset(i, "exposure_level", e.target.value)}
                  className="border border-emerald-pale rounded-lg px-2 py-2 text-sm">
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
              <button type="button" onClick={() => removeAsset(i)} className="text-xs text-red-500 px-2 py-2">Remove</button>
            </div>
          ))}

          <button type="button" onClick={addAsset} className="text-sm text-emerald font-medium">+ Add Asset</button>

          <button type="submit" disabled={loading}
            className="block bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Analyzing..." : "Visualize Attack Surface"}
          </button>
        </form>

        {result && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg text-charcoal">
                Overall Exposure: <span className="text-gold">{result.overall_exposure}</span>
              </h3>
              <span className="text-sm text-slate">{result.total_assets} Assets</span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Risk Heatmap</h3>
              <div className="grid grid-cols-2 gap-3">
                {result.risk_heatmap?.map((h, i) => (
                  <div key={i} className="border border-emerald-pale rounded-xl p-3 flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${colorMap[h.color] || "bg-slate"}`} />
                    <p className="text-sm text-charcoal">{h.asset}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Security Layers</h3>
              <div className="space-y-2">
                {result.security_layers?.map((l, i) => (
                  <div key={i} className="border border-emerald-pale rounded-xl p-3">
                    <p className="text-sm font-medium text-emerald">{l.layer}</p>
                    <p className="text-xs text-slate">{l.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">AI Recommendations</h3>
              <p className="text-sm text-slate whitespace-pre-wrap">{result.recommendations}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}