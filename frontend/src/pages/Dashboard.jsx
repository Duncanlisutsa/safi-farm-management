import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api/dashboard";
import Spinner from "../components/Spinner";

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (isLoading) return <Spinner label="Loading dashboard..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load dashboard. Try refreshing the page.</p>;

  const { summary, alerts, todays_tasks } = data;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Tea This Week" value={`${summary.tea_harvested_this_week_kg} kg`} />
        <MetricCard label="Active Pigs" value={summary.total_active_pigs} />
        <MetricCard label="Active Tasks" value={summary.active_tasks} />
        <MetricCard label="Factory Lines Running" value={summary.factory_lines_running_today} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">Alerts</h2>

          {alerts.vaccinations_overdue.length === 0 &&
           alerts.crops_ready_for_harvest.length === 0 &&
           alerts.feed_requests_pending_over_2_days === 0 &&
           alerts.supply_orders_pending_over_2_days === 0 ? (
            <p className="text-sm text-gray-400">No alerts right now.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {alerts.vaccinations_overdue.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded">
                  <span>⚠️</span>
                  <span>{v.pig__tag_id} — {v.vaccine_name} overdue since {v.next_due_date}</span>
                </div>
              ))}
              {alerts.crops_ready_for_harvest.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-yellow-800 bg-yellow-50 px-3 py-2 rounded">
                  <span>🌾</span>
                  <span>{c.name} ({c.plot_bed}) ready for harvest since {c.expected_harvest_date}</span>
                </div>
              ))}
              {alerts.feed_requests_pending_over_2_days > 0 && (
                <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded">
                  <span>🐷</span>
                  <span>{alerts.feed_requests_pending_over_2_days} feed request(s) pending over 2 days</span>
                </div>
              )}
              {alerts.supply_orders_pending_over_2_days > 0 && (
                <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded">
                  <span>📦</span>
                  <span>{alerts.supply_orders_pending_over_2_days} supply order(s) pending over 2 days</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">Today's Tasks</h2>
          {todays_tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks scheduled for today.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {todays_tasks.map((t) => (
                <li key={t.id} className="flex justify-between border-b pb-2">
                  <div>
                    <span className="font-medium">{t.title}</span>
                    <span className="text-gray-500 ml-2 capitalize">({t.category})</span>
                  </div>
                  <span className="text-gray-500">{t.assigned_to__username}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}