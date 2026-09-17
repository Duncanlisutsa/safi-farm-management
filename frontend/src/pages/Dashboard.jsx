import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getDashboard } from "../api/dashboard";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700",
  completed: "bg-green-100 text-green-700",
  carried_forward: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

const CATEGORY_LABELS = {
  crops: "Crops",
  tea: "Tea",
  pigs: "Pigs",
  poultry: "Poultry",
  fish: "Aquaculture",
  factory: "Factory",
  general: "General",
};

const TODAY_LABEL = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function Dashboard() {
  const username = useAuthStore((state) => state.user?.username);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (isLoading) return <Spinner label="Loading dashboard..." />;

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium mb-3">Failed to load dashboard.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, alerts, todays_tasks } = data;

  const totalAlerts =
    alerts.vaccinations_overdue.length +
    alerts.crops_ready_for_harvest.length +
    alerts.feed_requests_pending_over_2_days +
    alerts.supply_orders_pending_over_2_days;

  const alertChartData = [
    { name: "Vaccinations Overdue", value: alerts.vaccinations_overdue.length, fill: "#dc2626" },
    { name: "Crops Ready", value: alerts.crops_ready_for_harvest.length, fill: "#ca8a04" },
    { name: "Feed Pending", value: alerts.feed_requests_pending_over_2_days, fill: "#ea580c" },
    { name: "Orders Pending", value: alerts.supply_orders_pending_over_2_days, fill: "#ea580c" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {username ? `Welcome back, ${username}` : "Dashboard"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="🍃"
          label="Tea This Week"
          value={summary.tea_harvested_this_week_kg}
          unit="kg"
          accent="border-green-600"
        />
        <StatCard
          icon="🐷"
          label="Active Pigs"
          value={summary.total_active_pigs}
          accent="border-pink-500"
        />
        <StatCard
          icon="📋"
          label="Active Tasks"
          value={summary.active_tasks}
          accent="border-blue-500"
        />
        <StatCard
          icon="🏭"
          label="Factory Lines Running"
          value={summary.factory_lines_running_today}
          accent="border-purple-500"
        />
      </div>

      {/* Alerts + Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Alerts</h2>
            {totalAlerts > 0 && (
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                {totalAlerts}
              </span>
            )}
          </div>

          {totalAlerts === 0 ? (
            <EmptyState icon="✅" title="No alerts right now" subtitle="Everything looks on track" />
          ) : (
            <div className="space-y-2 text-sm max-h-96 overflow-y-auto pr-1">
              {alerts.vaccinations_overdue.map((v, i) => (
                <AlertRow
                  key={`vacc-${i}`}
                  icon="⚠️"
                  tone="red"
                  text={
                    <>
                      <span className="font-medium">{v.pig__tag_id}</span> — {v.vaccine_name}{" "}
                      overdue since {v.next_due_date}
                    </>
                  }
                />
              ))}
              {alerts.crops_ready_for_harvest.map((c) => (
                <AlertRow
                  key={`crop-${c.id}`}
                  icon="🌾"
                  tone="yellow"
                  text={
                    <>
                      <span className="font-medium">{c.name}</span> ({c.plot_bed}) ready for
                      harvest since {c.expected_harvest_date}
                    </>
                  }
                />
              ))}
              {alerts.feed_requests_pending_over_2_days > 0 && (
                <AlertRow
                  icon="🐷"
                  tone="orange"
                  text={`${alerts.feed_requests_pending_over_2_days} feed request(s) pending over 2 days`}
                />
              )}
              {alerts.supply_orders_pending_over_2_days > 0 && (
                <AlertRow
                  icon="📦"
                  tone="orange"
                  text={`${alerts.supply_orders_pending_over_2_days} supply order(s) pending over 2 days`}
                />
              )}
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today's Tasks</h2>
            {todays_tasks.length > 0 && (
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {todays_tasks.length}
              </span>
            )}
          </div>

          {todays_tasks.length === 0 ? (
            <EmptyState icon="📋" title="No tasks scheduled for today" />
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {todays_tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {CATEGORY_LABELS[t.category] || t.category}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{t.assigned_to__username}</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                      STATUS_STYLES[t.status] || STATUS_STYLES.pending
                    }`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Alerts breakdown chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Alerts Breakdown</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                interval={0}
                angle={-10}
                textAnchor="end"
                height={50}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {alertChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, accent }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${accent} border-t border-r border-b border-gray-100 p-4`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-base font-medium text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function AlertRow({ icon, tone, text }) {
  const toneStyles = {
    red: "text-red-700 bg-red-50 border-red-100",
    yellow: "text-yellow-800 bg-yellow-50 border-yellow-100",
    orange: "text-orange-700 bg-orange-50 border-orange-100",
  };
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${toneStyles[tone]}`}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}