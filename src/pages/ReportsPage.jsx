import { useState, useEffect } from "react";

const API_URL = "http://vanguard-ai.fastapicloud.dev";
const ORG_ID = 1; // hardcoded abhi ke liye, jaisa dashboard mein bhi hai

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  const token = localStorage.getItem("token");

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ org_id: ORG_ID, report_type: "Executive Summary" }),
      });
      const data = await res.json();
      setActiveReport(data);
      setReports((prev) => [data, ...prev]);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  function downloadPdf(reportId) {
    window.open(`${API_URL}/report/${reportId}/pdf`, "_blank");
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-2xl text-charcoal">Reports Center</h1>
          <button
            onClick={generateReport}
            disabled={generating}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate New Report"}
          </button>
        </div>

        {activeReport && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-display text-lg text-charcoal">
                Executive Summary — Report #{activeReport.report_id}
              </h2>
              <button
                onClick={() => downloadPdf(activeReport.report_id)}
                className="text-sm bg-gold text-white px-4 py-1.5 rounded-lg hover:bg-gold-soft transition"
              >
                Download PDF
              </button>
            </div>
            <p className="text-sm text-slate whitespace-pre-wrap">
              {activeReport.executive_summary}
            </p>
          </div>
        )}

        {reports.length === 0 && !activeReport && (
          <p className="text-slate text-sm">
            No reports yet. Click "Generate New Report" to create one.
          </p>
        )}
      </div>
    </div>
  );
}