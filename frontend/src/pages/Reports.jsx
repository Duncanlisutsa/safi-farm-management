import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReportsSummary } from "../api/reports";
import { exportToCsv } from "../utils/csvExport";
import { exportToPdf } from "../utils/pdfExport";
import Spinner from "../components/Spinner";

const today = new Date().toISOString().split("T")[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

export default function Reports() {
  const [start, setStart] = useState(thirtyDaysAgo);
  const [end, setEnd] = useState(today);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-summary", start, end],
    queryFn: () => getReportsSummary(start, end),
  });

  const exportTea = (format) => {
    if (!data) return;
    const rows = [
      { period_start: start, period_end: end, total_kg: data.tea.total_kg, entries: data.tea.entry_count },
      ...data.tea.grade_breakdown.map((g) => ({ grade: g.grade, total_kg: g.total_kg })),
    ];
    if (format === "csv") exportToCsv(`tea-report-${start}-to-${end}.csv`, rows);
    else exportToPdf(`tea-report-${start}-to-${end}.pdf`, "Tea Production Report", `${start} to ${end}`, rows);
  };

  const exportCrops = (format) => {
    if (!data) return;
    const rows = data.crops.by_crop.map((c) => ({ crop: c.crop__name || "Unknown", total_kg: c.total_kg }));
    if (format === "csv") exportToCsv(`crops-report-${start}-to-${end}.csv`, rows);
    else exportToPdf(`crops-report-${start}-to-${end}.pdf`, "Crops Production Report", `${start} to ${end}`, rows);
  };

  const exportPigs = (format) => {
    if (!data) return;
    const rows = [
      { metric: "Active pigs", value: data.pigs.total_active_pigs },
      { metric: "Births", value: data.pigs.births },
      { metric: "Deaths", value: data.pigs.deaths },
      { metric: "Sales count", value: data.pigs.sales_count },
      { metric: "Sales revenue", value: data.pigs.sales_total_amount },
      { metric: "Feed requests pending", value: data.pigs.feed_requests_pending },
    ];
    if (format === "csv") exportToCsv(`pigs-report-${start}-to-${end}.csv`, rows);
    else exportToPdf(`pigs-report-${start}-to-${end}.pdf`, "Pig Records Report", `${start} to ${end}`, rows);
  };

  const exportAquaculture = (format) => {
    if (!data) return;
    const rows = [
      { metric: "Active ponds", value: data.aquaculture.active_ponds },
      { metric: "Harvest events", value: data.aquaculture.harvest_events },
      { metric: "Mortality events", value: data.aquaculture.mortality_events },
    ];
    if (format === "csv") exportToCsv(`aquaculture-report-${start}-to-${end}.csv`, rows);
    else exportToPdf(`aquaculture-report-${start}-to-${end}.pdf`, "Aquaculture Report", `${start} to ${end}`, rows);
  };

  const exportFactory = (format) => {
    if (!data) return;
    const rows = data.factory.by_production_line.map((l) => ({
      production_line: l.production_line,
      batch_count: l.batch_count,
      total_input_kg: l.total_input_kg ?? "",
      total_output: l.total_output ?? "",
    }));
    if (format === "csv") exportToCsv(`factory-report-${start}-to-${end}.csv`, rows);
    else exportToPdf(`factory-report-${start}-to-${end}.pdf`, "Factory Production Report", `${start} to ${end}`, rows);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Production Reports</h1>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded px-2 py-1" />
          <span>to</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded px-2 py-1" />
        </div>
      </div>

      {isLoading && <Spinner label="Loading reports..." />}
      {isError && <p className="text-red-600 text-center py-12">Failed to load reports. Try refreshing the page.</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportCard title="Tea" onExport={exportTea}>
            <Stat label="Total harvested" value={`${data.tea.total_kg} kg`} />
            <Stat label="Entries" value={data.tea.entry_count} />
            {data.tea.grade_breakdown.map((g) => (
              <Stat key={g.grade} label={`Grade ${g.grade}`} value={`${g.total_kg} kg`} />
            ))}
          </ReportCard>

          <ReportCard title="Crops" onExport={exportCrops}>
            <Stat label="Entries" value={data.crops.entry_count} />
            {data.crops.by_crop.slice(0, 5).map((c) => (
              <Stat key={c.crop__name} label={c.crop__name || "Unknown"} value={`${c.total_kg} kg`} />
            ))}
          </ReportCard>

          <ReportCard title="Pigs" onExport={exportPigs}>
            <Stat label="Active pigs" value={data.pigs.total_active_pigs} />
            <Stat label="Births" value={data.pigs.births} />
            <Stat label="Deaths" value={data.pigs.deaths} />
            <Stat label="Sales" value={data.pigs.sales_count} />
            <Stat label="Sales revenue" value={data.pigs.sales_total_amount} />
            <Stat label="Feed requests pending" value={data.pigs.feed_requests_pending} />
          </ReportCard>

          <ReportCard title="Aquaculture" onExport={exportAquaculture}>
            <Stat label="Active ponds" value={data.aquaculture.active_ponds} />
            <Stat label="Harvest events" value={data.aquaculture.harvest_events} />
            <Stat label="Mortality events" value={data.aquaculture.mortality_events} />
          </ReportCard>

          <ReportCard title="Factory" full onExport={exportFactory}>
            {data.factory.by_production_line.length === 0 ? (
              <p className="text-sm text-gray-400">No production in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm mt-2">
                  <thead className="text-gray-500 text-left">
                    <tr>
                      <th className="py-1">Line</th>
                      <th className="py-1">Batches</th>
                      <th className="py-1">Input (kg)</th>
                      <th className="py-1">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.factory.by_production_line.map((l) => (
                      <tr key={l.production_line} className="border-t">
                        <td className="py-1 capitalize">{l.production_line.replace("_", " ")}</td>
                        <td className="py-1">{l.batch_count}</td>
                        <td className="py-1">{l.total_input_kg ?? "—"}</td>
                        <td className="py-1">{l.total_output ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportCard>
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, children, full, onExport }) {
  return (
    <div className={`bg-white rounded shadow p-4 ${full ? "md:col-span-2" : ""}`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold">{title}</h2>
        {onExport && (
          <div className="flex gap-3 text-xs">
            <button onClick={() => onExport("csv")} className="text-green-700 hover:text-green-900 font-medium">
              ⬇ CSV
            </button>
            <button onClick={() => onExport("pdf")} className="text-red-700 hover:text-red-900 font-medium">
              ⬇ PDF
            </button>
          </div>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}