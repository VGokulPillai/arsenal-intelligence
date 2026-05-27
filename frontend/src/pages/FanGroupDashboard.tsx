import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  LogIn,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
} from "lucide-react";
import { api } from "../lib/api";
import AnimatedCard from "../components/AnimatedCard";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface DashboardStats {
  total_groups: number;
  total_allocated: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  checked_in: number;
  open_issues: number;
}

interface FanGroup {
  group_id: string;
  name: string;
  region: string;
  group_type: string;
  primary_contact: string;
  member_count: number;
  allocated: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

interface Fixture {
  match_id: string;
  opponent: string;
  date: string;
  venue: string;
  competition: string;
  kickoff: string;
}

export default function FanGroupDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groups, setGroups] = useState<FanGroup[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedFixture) params.fixture_id = selectedFixture;
      if (selectedType) params.group_type = selectedType;
      if (selectedRegion) params.region = selectedRegion;

      const data = await api.fanOps.dashboard(params) as { stats: DashboardStats; groups: FanGroup[] };
      setStats(data.stats);
      setGroups(data.groups);
    } catch {
      setStats({ total_groups: 20, total_allocated: 0, confirmed: 0, pending: 0, cancelled: 0, checked_in: 0, open_issues: 0 });
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFixture, selectedType, selectedRegion]);

  useEffect(() => {
    api.fanOps.fixtures().then((data) => setFixtures(data as unknown as Fixture[])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard();
  }, [loadDashboard]);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const kpis = [
    { label: "Fan Groups", value: stats?.total_groups ?? 0, icon: Users, color: "text-arsenal-red" },
    { label: "Allocated", value: stats?.total_allocated ?? 0, icon: Ticket, color: "text-blue-400" },
    { label: "Confirmed", value: stats?.confirmed ?? 0, icon: CheckCircle, color: "text-green-400" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-yellow-400" },
    { label: "Cancelled", value: stats?.cancelled ?? 0, icon: XCircle, color: "text-red-400" },
    { label: "Checked In", value: stats?.checked_in ?? 0, icon: LogIn, color: "text-emerald-400" },
    { label: "Open Issues", value: stats?.open_issues ?? 0, icon: AlertTriangle, color: "text-orange-400" },
  ];

  const uniqueRegions = [...new Set(groups.map((g) => g.region))].sort();

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-arsenal-red pl-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-white">
          Fan Group Operations
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Matchday ticket allocations, check-ins & issue management
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((kpi) => (
          <AnimatedCard key={kpi.label}>
            <div className="p-3 text-center">
              <kpi.icon className={`w-5 h-5 mx-auto mb-1 ${kpi.color}`} />
              <div className="text-xl font-bold text-white">{loading ? "—" : kpi.value.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.label}</div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Filters */}
      <AnimatedCard>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-arsenal-gold" />
            <span className="text-sm font-medium text-gray-300">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={selectedFixture}
              onChange={(e) => setSelectedFixture(e.target.value)}
              className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
            >
              <option value="">All Fixtures</option>
              {fixtures.map((f) => (
                <option key={f.match_id} value={f.match_id}>
                  vs {f.opponent} — {f.date}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="local">Local</option>
              <option value="international">International</option>
              <option value="trust">Trust</option>
              <option value="accessibility">Accessibility</option>
              <option value="corporate">Corporate</option>
            </select>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
            >
              <option value="">All Regions</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-arsenal-red focus:outline-none"
              />
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Groups Table */}
      <AnimatedCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Group</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Region</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Members</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Allocated</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Confirmed</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Pending</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Cancelled</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g) => (
                <tr
                  key={g.group_id}
                  onClick={() => navigate(`/fan-ops/${g.group_id}${selectedFixture ? `?fixture_id=${selectedFixture}` : ""}`)}
                  className="border-b border-gray-800/30 hover:bg-gray-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-gray-300">{g.region}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      g.group_type === "local" ? "bg-blue-900/40 text-blue-300" :
                      g.group_type === "international" ? "bg-purple-900/40 text-purple-300" :
                      g.group_type === "trust" ? "bg-green-900/40 text-green-300" :
                      g.group_type === "accessibility" ? "bg-yellow-900/40 text-yellow-300" :
                      "bg-gray-700/40 text-gray-300"
                    }`}>
                      {g.group_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">{g.member_count}</td>
                  <td className="px-4 py-3 text-center text-white font-medium">{g.allocated}</td>
                  <td className="px-4 py-3 text-center text-green-400">{g.confirmed}</td>
                  <td className="px-4 py-3 text-center text-yellow-400">{g.pending}</td>
                  <td className="px-4 py-3 text-center text-red-400">{g.cancelled}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </td>
                </tr>
              ))}
              {filteredGroups.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No fan groups found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AnimatedCard>
    </motion.div>
  );
}
