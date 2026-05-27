import { motion } from "framer-motion";
import { Database, Globe, Brain, Shield, Zap, Server, Monitor, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

function DataFlowLine({ from, to, color = "#EF0107", delay = 0 }: { from: string; to: string; color?: string; delay?: number }) {
  return (
    <div className="relative flex items-center gap-0 w-full">
      <span className="text-[10px] text-white/40 shrink-0 w-20 text-right pr-2">{from}</span>
      <div className="flex-1 relative h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, width: "40%" }}
          animate={{ x: ["0%", "160%"] }}
          transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <span className="text-[10px] text-white/40 shrink-0 w-20 pl-2">{to}</span>
    </div>
  );
}

export default function Architecture() {
  const [dbMode, setDbMode] = useState<string>("checking...");
  const [fanOpsStats, setFanOpsStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/health").then(r => r.json()).then(d => setDbMode(d.fan_ops_db ?? "unknown")).catch(() => setDbMode("error"));
    api.fanOps.dashboard().then(d => {
      const stats = (d as any)?.stats ?? d;
      setFanOpsStats(stats);
    }).catch(() => {});
  }, []);

  const nodes = [
    { id: "source", label: "Data Sources", sublabel: "API-Football, Ticketmaster, CRM", icon: Globe, color: "#3B82F6", x: 0, y: 0 },
    { id: "bronze", label: "Bronze Layer", sublabel: "Raw event ingestion", icon: Database, color: "#CD7F32", x: 1, y: 0 },
    { id: "silver", label: "Silver Layer", sublabel: "Cleaned & enriched", icon: Database, color: "#C0C0C0", x: 2, y: 0 },
    { id: "gold", label: "Gold Layer", sublabel: "Business-ready views", icon: Database, color: "#DAA520", x: 3, y: 0 },
    { id: "lakebase", label: "Lakebase", sublabel: "Low-latency operational DB", icon: Zap, color: "#EF0107", x: 4, y: 0 },
    { id: "app", label: "Databricks App", sublabel: "Arsenal Intelligence", icon: Monitor, color: "#FFFFFF", x: 5, y: 0 },
    { id: "genie", label: "Genie AI", sublabel: "Natural language analytics", icon: Brain, color: "#A855F7", x: 4, y: 1 },
  ];

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-arsenal-red pl-4">
        <h1 className="text-3xl font-display tracking-widest text-white uppercase">Architecture</h1>
        <p className="text-white/60 mt-1">
          Data pipeline architecture — showing how fan group operations flow through Databricks into Lakebase
        </p>
      </div>

      {/* Live Lakebase Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Database className="w-8 h-8 text-arsenal-red" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Live Lakebase Connection</h2>
            <p className="text-sm text-white/50">Fan Group Operations are persisted in Databricks Lakebase (PostgreSQL)</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${dbMode === "lakebase" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
              {dbMode === "lakebase" ? "● CONNECTED TO LAKEBASE" : `● ${dbMode.toUpperCase()}`}
            </span>
          </div>
        </div>

        {fanOpsStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Fan Groups", value: (fanOpsStats as any).total_groups ?? 0, color: "text-white" },
              { label: "Allocated", value: (fanOpsStats as any).total_allocated ?? 0, color: "text-arsenal-gold" },
              { label: "Confirmed", value: (fanOpsStats as any).confirmed ?? 0, color: "text-green-400" },
              { label: "Pending", value: (fanOpsStats as any).pending ?? 0, color: "text-amber-400" },
              { label: "Cancelled", value: (fanOpsStats as any).cancelled ?? 0, color: "text-red-400" },
              { label: "Checked In", value: (fanOpsStats as any).checked_in ?? 0, color: "text-blue-400" },
              { label: "Open Issues", value: (fanOpsStats as any).open_issues ?? 0, color: "text-rose-400" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Animated Architecture Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card !rounded-xl p-8 border border-white/[0.12] shadow-glass"
      >
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Server className="w-5 h-5 text-arsenal-gold" />
          Data Pipeline Architecture
        </h2>

        {/* Main flow */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          {nodes.filter(n => n.y === 0).map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                node.id === "lakebase"
                  ? "bg-arsenal-red/10 border-arsenal-red/40 shadow-lg shadow-arsenal-red/10"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}>
                <motion.div
                  animate={node.id === "lakebase" ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <node.icon className="w-8 h-8 mb-2" style={{ color: node.color }} />
                </motion.div>
                <p className="text-sm font-semibold text-white text-center">{node.label}</p>
                <p className="text-[10px] text-white/50 text-center mt-1">{node.sublabel}</p>
              </div>
              {i < 5 && (
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4 text-white/30" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Genie AI branch */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-4 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30"
          >
            <Brain className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-white">Genie AI Assistant</p>
              <p className="text-[10px] text-white/50">Queries Lakebase + Gold layer for natural language answers</p>
            </div>
            <Sparkles className="w-5 h-5 text-purple-300" />
          </motion.div>
        </div>

        {/* Animated data flow lines */}
        <div className="space-y-3 mt-6 px-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Live Data Flows</p>
          <DataFlowLine from="API-Football" to="Bronze" color="#3B82F6" delay={0} />
          <DataFlowLine from="Ticketmaster" to="Bronze" color="#10B981" delay={0.5} />
          <DataFlowLine from="Bronze" to="Silver" color="#C0C0C0" delay={1} />
          <DataFlowLine from="Silver" to="Gold" color="#DAA520" delay={1.5} />
          <DataFlowLine from="Gold" to="Lakebase" color="#EF0107" delay={2} />
          <DataFlowLine from="Lakebase" to="App" color="#FFFFFF" delay={2.5} />
          <DataFlowLine from="Lakebase" to="Genie" color="#A855F7" delay={3} />
        </div>
      </motion.div>

      {/* Why Lakebase */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-arsenal-gold" />
          Why Lakebase for Fan Group Operations?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Low-Latency CRUD",
              desc: "Instant ticket status updates, check-ins, and issue tracking. Sub-10ms response for matchday ops.",
              icon: Zap, color: "text-emerald-400",
            },
            {
              title: "Transactional Integrity",
              desc: "ACID-compliant PostgreSQL ensures no duplicate check-ins or lost ticket updates during peak matchday load.",
              icon: Shield, color: "text-blue-400",
            },
            {
              title: "Unified Platform",
              desc: "Same Databricks platform manages analytical Delta tables AND operational Lakebase — no external databases needed.",
              icon: Database, color: "text-arsenal-gold",
            },
            {
              title: "Genie-Ready",
              desc: "Genie AI can query Lakebase directly for real-time fan group insights without ETL delays.",
              icon: Brain, color: "text-purple-400",
            },
            {
              title: "OAuth Security",
              desc: "Service principal authentication with auto-rotating tokens. No static passwords. Enterprise-grade security.",
              icon: Shield, color: "text-rose-400",
            },
            {
              title: "App-Native Integration",
              desc: "Databricks Apps auto-inject connection credentials. Zero config needed from the application developer.",
              icon: Server, color: "text-white",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-arsenal-red/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <h3 className="font-semibold text-white text-sm">{item.title}</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Data Model */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-arsenal-gold" />
          Lakebase Schema — <code className="text-xs bg-white/10 px-2 py-0.5 rounded font-mono">arsenal_fan_ops</code>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { table: "fan_ops_fixtures", rows: "5 fixtures", desc: "Arsenal home matches" },
            { table: "fan_ops_groups", rows: "20 groups", desc: "Supporter groups worldwide" },
            { table: "fan_ops_fans", rows: "~500 fans", desc: "Individual members" },
            { table: "fan_ops_ticket_allocations", rows: "~1700 tickets", desc: "Seat allocations per fixture" },
            { table: "fan_ops_checkin_events", rows: "~1100 check-ins", desc: "Gate entry events" },
            { table: "fan_ops_group_issues", rows: "~20 issues", desc: "Operational problems" },
            { table: "fan_ops_operational_notes", rows: "Staff notes", desc: "Matchday annotations" },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className="p-3 rounded-lg bg-arsenal-red/5 border border-arsenal-red/20 hover:border-arsenal-red/40 transition-colors"
            >
              <p className="font-mono text-xs text-arsenal-gold truncate">{t.table}</p>
              <p className="text-[10px] text-white/50 mt-1">{t.rows}</p>
              <p className="text-[10px] text-white/40">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How Genie uses this */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card !rounded-xl p-6 border border-purple-500/20 shadow-glass"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Genie AI — Powered by Lakebase
        </h2>
        <p className="text-sm text-white/60 mb-4">
          The Genie assistant queries Lakebase in real-time to answer natural language questions about fan group operations:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Which fan groups have pending tickets for Arsenal vs Chelsea?",
            "Which international fan groups have the highest attendance?",
            "Which fan groups have open accessibility requests?",
            "Which groups have not checked in yet?",
            "Which fan groups need matchday support before kick-off?",
            "Show me cancellation rates by group type this season",
          ].map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20"
            >
              <Brain className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/70 italic">"{q}"</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
