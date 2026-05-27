import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  PenLine,
} from "lucide-react";
import { api } from "../lib/api";
import AnimatedCard from "../components/AnimatedCard";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface Issue {
  issue_id: string;
  fan_group_id: string;
  group_name: string;
  fixture_id: string;
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

export default function FanOpsUpdates() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState("");
  const [issueFilter, setIssueFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // New issue form
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [newIssueGroup, setNewIssueGroup] = useState("");
  const [newIssueType, setNewIssueType] = useState("gate_access");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [groups, setGroups] = useState<{ group_id: string; name: string }[]>([]);

  // Note form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteEntityType, setNoteEntityType] = useState("group");
  const [noteEntityId, setNoteEntityId] = useState("");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    api.fanOps.fixtures().then((d) => setFixtures(d as unknown as Fixture[])).catch(() => {});
    api.fanOps.groups().then((d) => setGroups(d as unknown as { group_id: string; name: string }[])).catch(() => {});
  }, []);

  useEffect(() => {
    loadIssues();
  }, [selectedFixture, issueFilter]);

  async function loadIssues() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedFixture) params.fixture_id = selectedFixture;
      if (issueFilter) params.status = issueFilter;
      const data = await api.fanOps.issues(params);
      setIssues(data as unknown as Issue[]);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  async function resolveIssue(issueId: string) {
    await api.fanOps.updateIssue(issueId, "resolved");
    setActionMsg(`Issue ${issueId} resolved`);
    setTimeout(() => setActionMsg(""), 3000);
    loadIssues();
  }

  async function escalateIssue(issueId: string) {
    await api.fanOps.updateIssue(issueId, "escalated");
    setActionMsg(`Issue ${issueId} escalated`);
    setTimeout(() => setActionMsg(""), 3000);
    loadIssues();
  }

  async function submitNewIssue() {
    if (!newIssueGroup || !newIssueDesc || !selectedFixture) {
      setActionMsg("Please select a fixture, group, and provide a description.");
      setTimeout(() => setActionMsg(""), 3000);
      return;
    }
    await api.fanOps.createIssue({
      fan_group_id: newIssueGroup,
      fixture_id: selectedFixture,
      issue_type: newIssueType,
      description: newIssueDesc,
    });
    setActionMsg("Issue created successfully");
    setShowNewIssue(false);
    setNewIssueDesc("");
    setTimeout(() => setActionMsg(""), 3000);
    loadIssues();
  }

  async function submitNote() {
    if (!noteEntityId || !noteText) {
      setActionMsg("Please fill all note fields.");
      setTimeout(() => setActionMsg(""), 3000);
      return;
    }
    await api.fanOps.createNote({
      entity_type: noteEntityType,
      entity_id: noteEntityId,
      fixture_id: selectedFixture || undefined,
      note: noteText,
      author: "ops_staff",
    });
    setActionMsg("Note added successfully");
    setShowNoteForm(false);
    setNoteText("");
    setTimeout(() => setActionMsg(""), 3000);
  }

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-arsenal-red pl-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-white">
          Operational Updates
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage issues, check-ins, ticket changes & operational notes
        </p>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-4 py-2 text-sm text-green-300">
          {actionMsg}
        </div>
      )}

      {/* Filters + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedFixture}
          onChange={(e) => setSelectedFixture(e.target.value)}
          className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
        >
          <option value="">All Fixtures</option>
          {fixtures.map((f) => (
            <option key={f.match_id} value={f.match_id}>vs {f.opponent} — {f.date}</option>
          ))}
        </select>

        <select
          value={issueFilter}
          onChange={(e) => setIssueFilter(e.target.value)}
          className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
        >
          <option value="open">Open Issues</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="">All Statuses</option>
        </select>

        <button
          onClick={() => loadIssues()}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowNewIssue(!showNewIssue)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-arsenal-red/20 border border-arsenal-red/40 text-sm text-arsenal-red hover:bg-arsenal-red/30 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          New Issue
        </button>

        <button
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-arsenal-gold/20 border border-arsenal-gold/40 text-sm text-arsenal-gold hover:bg-arsenal-gold/30 transition-colors"
        >
          <PenLine className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* New Issue Form */}
      {showNewIssue && (
        <AnimatedCard>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide">Create Issue</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={newIssueGroup}
                onChange={(e) => setNewIssueGroup(e.target.value)}
                className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g.group_id} value={g.group_id}>{g.name}</option>
                ))}
              </select>
              <select
                value={newIssueType}
                onChange={(e) => setNewIssueType(e.target.value)}
                className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
              >
                <option value="gate_access">Gate Access</option>
                <option value="seating_dispute">Seating Dispute</option>
                <option value="accessibility_request">Accessibility Request</option>
                <option value="late_allocation">Late Allocation</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="group_separation">Group Separation</option>
                <option value="transport_delay">Transport Delay</option>
              </select>
              <input
                type="text"
                placeholder="Description..."
                value={newIssueDesc}
                onChange={(e) => setNewIssueDesc(e.target.value)}
                className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-arsenal-red focus:outline-none"
              />
            </div>
            <button
              onClick={submitNewIssue}
              className="px-4 py-2 rounded-lg bg-arsenal-red text-white text-sm font-medium hover:bg-arsenal-red/80 transition-colors"
            >
              Submit Issue
            </button>
          </div>
        </AnimatedCard>
      )}

      {/* Note Form */}
      {showNoteForm && (
        <AnimatedCard>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide">Add Operational Note</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={noteEntityType}
                onChange={(e) => setNoteEntityType(e.target.value)}
                className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
              >
                <option value="group">Fan Group</option>
                <option value="fixture">Fixture</option>
                <option value="ticket">Ticket</option>
              </select>
              <select
                value={noteEntityId}
                onChange={(e) => setNoteEntityId(e.target.value)}
                className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-arsenal-red focus:outline-none"
              >
                <option value="">Select Entity</option>
                {noteEntityType === "group" && groups.map((g) => (
                  <option key={g.group_id} value={g.group_id}>{g.name}</option>
                ))}
                {noteEntityType === "fixture" && fixtures.map((f) => (
                  <option key={f.match_id} value={f.match_id}>vs {f.opponent}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Note content..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-arsenal-red focus:outline-none"
              />
            </div>
            <button
              onClick={submitNote}
              className="px-4 py-2 rounded-lg bg-arsenal-gold text-black text-sm font-medium hover:bg-arsenal-gold/80 transition-colors"
            >
              Save Note
            </button>
          </div>
        </AnimatedCard>
      )}

      {/* Issues List */}
      <AnimatedCard>
        <div className="p-4">
          <h3 className="text-sm font-medium text-arsenal-gold uppercase tracking-wide mb-3">
            Issues ({issues.length})
          </h3>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : issues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No issues matching filters.</div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue) => (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{issue.group_name}</span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-sm text-gray-300 capitalize">{issue.issue_type.replace(/_/g, " ")}</span>
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
                      {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {issue.status !== "resolved" && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => resolveIssue(issue.issue_id)}
                        className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-300 hover:bg-green-900/50 transition-colors"
                      >
                        Resolve
                      </button>
                      {issue.status === "open" && (
                        <button
                          onClick={() => escalateIssue(issue.issue_id)}
                          className="px-2 py-1 rounded text-xs bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-colors"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimatedCard>
    </motion.div>
  );
}
