import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Mail,
  MapPin,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import { api } from "../lib/api";
import AnimatedCard from "../components/AnimatedCard";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface GroupDetail {
  group_id: string;
  name: string;
  region: string;
  group_type: string;
  primary_contact: string;
  contact_email: string;
  member_count: number;
  tickets: TicketRow[];
  issues: Issue[];
}

interface TicketRow {
  ticket_id: string;
  fan_id: string;
  fan_name: string;
  membership_id: string;
  seat_block: string;
  row: string;
  seat: string;
  ticket_status: string;
  payment_status: string;
  gate: string;
  stand: string;
  checked_in: number | null;
  checkin_time: string | null;
  checkin_gate: string | null;
}

interface Issue {
  issue_id: string;
  issue_type: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

interface Fixture {
  match_id: string;
  opponent: string;
  date: string;
}

export default function FanGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fixtureId = searchParams.get("fixture_id") || "";

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState(fixtureId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fanOps.fixtures().then((data) => setFixtures(data as unknown as Fixture[])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    api.fanOps
      .group(groupId, selectedFixture || undefined)
      .then((data) => setGroup(data as unknown as GroupDetail))
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [groupId, selectedFixture]);

  if (loading) {
    return (
      <motion.div {...fadeInUp} className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading group details...</div>
      </motion.div>
    );
  }

  if (!group) {
    return (
      <motion.div {...fadeInUp} className="text-center py-16">
        <p className="text-gray-400">Group not found.</p>
        <button onClick={() => navigate("/fan-ops")} className="mt-4 text-arsenal-gold hover:underline">
          Back to Dashboard
        </button>
      </motion.div>
    );
  }

  const confirmedCount = group.tickets.filter((t) => t.ticket_status === "confirmed").length;
  const pendingCount = group.tickets.filter((t) => t.ticket_status === "pending").length;
  const cancelledCount = group.tickets.filter((t) => t.ticket_status === "cancelled").length;
  const checkedInCount = group.tickets.filter((t) => t.checked_in === 1).length;
  const openIssuesCount = group.issues.filter((i) => i.status === "open").length;

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/fan-ops")}
          className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div className="border-l-4 border-arsenal-red pl-4">
          <h1 className="font-display text-3xl uppercase tracking-wide text-white">
            {group.name}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {group.group_type} · {group.region}
          </p>
        </div>
      </div>

      {/* Group Info + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AnimatedCard>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide">Group Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{group.member_count} members</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{group.region}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{group.contact_email}</span>
              </div>
              <div className="text-gray-300">
                <span className="text-gray-500">Contact:</span> {group.primary_contact}
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide">Ticket Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">{group.tickets.length}</div>
                  <div className="text-xs text-gray-400">Allocated</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-lg font-bold text-white">{confirmedCount}</div>
                  <div className="text-xs text-gray-400">Confirmed</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="text-lg font-bold text-white">{pendingCount}</div>
                  <div className="text-xs text-gray-400">Pending</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-lg font-bold text-white">{cancelledCount}</div>
                  <div className="text-xs text-gray-400">Cancelled</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide">Operations</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-lg font-bold text-white">{checkedInCount}</div>
                  <div className="text-xs text-gray-400">Checked In</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <div>
                  <div className="text-lg font-bold text-white">{openIssuesCount}</div>
                  <div className="text-xs text-gray-400">Open Issues</div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <select
                value={selectedFixture}
                onChange={(e) => setSelectedFixture(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
              >
                <option value="">All Fixtures</option>
                {fixtures.map((f) => (
                  <option key={f.match_id} value={f.match_id}>vs {f.opponent} — {f.date}</option>
                ))}
              </select>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Tickets Table */}
      <AnimatedCard>
        <div className="p-4">
          <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide mb-3">
            Fan Tickets ({group.tickets.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left px-3 py-2 text-gray-400 font-medium">Fan</th>
                  <th className="text-left px-3 py-2 text-gray-400 font-medium">Member ID</th>
                  <th className="text-center px-3 py-2 text-gray-400 font-medium">Block</th>
                  <th className="text-center px-3 py-2 text-gray-400 font-medium">Row/Seat</th>
                  <th className="text-center px-3 py-2 text-gray-400 font-medium">Gate</th>
                  <th className="text-center px-3 py-2 text-gray-400 font-medium">Stand</th>
                  <th className="text-center px-3 py-2 text-gray-400 font-medium">Status</th>
                  <th className="text-center px-3 py-2 text-gray-400 font-medium">Payment</th>
                  <th className="text-center px-3 py-2 text-gray-400 font-medium">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {group.tickets.slice(0, 50).map((t) => (
                  <tr key={t.ticket_id} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                    <td className="px-3 py-2 text-white">{t.fan_name}</td>
                    <td className="px-3 py-2 text-gray-400 font-mono text-xs">{t.membership_id}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{t.seat_block}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{t.row}{t.seat}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{t.gate}</td>
                    <td className="px-3 py-2 text-center text-gray-300 text-xs">{t.stand}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        t.ticket_status === "confirmed" ? "bg-green-900/40 text-green-300" :
                        t.ticket_status === "pending" ? "bg-yellow-900/40 text-yellow-300" :
                        "bg-red-900/40 text-red-300"
                      }`}>
                        {t.ticket_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs ${t.payment_status === "paid" ? "text-green-400" : t.payment_status === "refunded" ? "text-gray-400" : "text-yellow-400"}`}>
                        {t.payment_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {t.checked_in === 1 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : t.ticket_status === "confirmed" ? (
                        <Clock className="w-4 h-4 text-gray-500 mx-auto" />
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {group.tickets.length > 50 && (
              <p className="text-center text-xs text-gray-500 mt-2">
                Showing 50 of {group.tickets.length} tickets
              </p>
            )}
          </div>
        </div>
      </AnimatedCard>

      {/* Issues */}
      {group.issues.length > 0 && (
        <AnimatedCard>
          <div className="p-4">
            <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide mb-3">
              Issues ({group.issues.length})
            </h3>
            <div className="space-y-2">
              {group.issues.map((issue) => (
                <div
                  key={issue.issue_id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    issue.status === "open" ? "bg-orange-900/10 border border-orange-800/30" :
                    issue.status === "escalated" ? "bg-red-900/10 border border-red-800/30" :
                    "bg-gray-800/30 border border-gray-700/30"
                  }`}
                >
                  {issue.status === "open" ? (
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  ) : issue.status === "escalated" ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white capitalize">
                        {issue.issue_type.replace(/_/g, " ")}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                        issue.status === "open" ? "bg-orange-900/40 text-orange-300" :
                        issue.status === "escalated" ? "bg-red-900/40 text-red-300" :
                        "bg-green-900/40 text-green-300"
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{issue.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(issue.created_at).toLocaleDateString()}
                      {issue.resolved_at && ` · Resolved: ${new Date(issue.resolved_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>
      )}
    </motion.div>
  );
}
