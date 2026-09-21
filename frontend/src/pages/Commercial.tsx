import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Megaphone, Target, TrendingUp, DollarSign, Users, Globe,
  Clock, BarChart3, Briefcase, ShoppingBag, Plane
} from "lucide-react";
import { api } from "../lib/api";

interface Campaign {
  id: string;
  name: string;
  status: string;
  type: string;
  target_audience: string;
  budget_k: number;
  spend_k: number;
  revenue_generated_k: number;
  roi_pct: number;
  start_date: string;
  end_date: string;
  fixtures_targeted: string[];
  channels: string[];
  kpis: Record<string, unknown>;
}

interface Partner {
  name: string;
  type: string;
  annual_value_m: number;
  contract_end: string;
  status: string;
}

interface PipelineItem {
  prospect: string;
  type: string;
  est_value_m: number;
  stage: string;
  probability_pct: number;
}

const typeIcons: Record<string, typeof Megaphone> = {
  Hospitality: Briefcase,
  Membership: Users,
  "Global Membership": Globe,
  Merchandise: ShoppingBag,
  Concessions: DollarSign,
  Travel: Plane,
};

export default function Commercial() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sponsorship, setSponsorship] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.revenue.campaigns(),
      api.revenue.sponsorship(),
    ]).then(([c, s]) => {
      if (c.status === "fulfilled") setCampaigns(c.value as unknown as Campaign[]);
      if (s.status === "fulfilled") setSponsorship(s.value);
      setLoading(false);
    });
  }, []);

  const partners = (sponsorship?.partners ?? []) as unknown as Partner[];
  const pipeline = (sponsorship?.pipeline ?? []) as unknown as PipelineItem[];
  const totalSponsorship = Number(sponsorship?.total_sponsorship_m ?? 0);
  const yoyGrowth = Number(sponsorship?.yoy_growth_pct ?? 0);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const plannedCampaigns = campaigns.filter((c) => c.status === "planned");
  const totalBudget = campaigns.reduce((s, c) => s + c.budget_k, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue_generated_k, 0);
  const avgROI = activeCampaigns.length > 0
    ? activeCampaigns.reduce((s, c) => s + c.roi_pct, 0) / activeCampaigns.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-arsenal-red border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-arsenal-gold pl-4">
        <h1 className="text-3xl font-display tracking-widest text-white uppercase">
          Commercial & Campaigns
        </h1>
        <p className="text-white/60 mt-1">
          Active campaigns, sponsorship portfolio, and commercial revenue intelligence.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sponsorship Revenue", value: `£${totalSponsorship}M`, sub: `+${yoyGrowth}% YoY`, color: "text-arsenal-gold" },
          { label: "Campaign Revenue", value: `£${(totalRevenue / 1000).toFixed(1)}M`, sub: `${activeCampaigns.length} active`, color: "text-emerald-400" },
          { label: "Total Budget", value: `£${totalBudget}k`, sub: `${((campaigns.reduce((s, c) => s + c.spend_k, 0) / totalBudget) * 100).toFixed(0)}% spent`, color: "text-white" },
          { label: "Avg Campaign ROI", value: `${avgROI.toFixed(0)}%`, sub: "Active campaigns", color: "text-emerald-400" },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
          >
            <p className="text-xs text-white/50">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Campaigns */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-arsenal-red" />
          <h2 className="text-lg font-semibold text-white">Active Campaigns</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {activeCampaigns.length} running
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeCampaigns.map((camp, i) => {
            const Icon = typeIcons[camp.type] || Target;
            const spendPct = camp.budget_k > 0 ? (camp.spend_k / camp.budget_k) * 100 : 0;
            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-arsenal-red/10 border border-arsenal-red/20">
                    <Icon className="w-4 h-4 text-arsenal-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-white font-medium text-sm truncate">{camp.name}</h3>
                      <span className="text-emerald-400 text-xs font-bold whitespace-nowrap">ROI {camp.roi_pct}%</span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{camp.type} · {camp.target_audience}</p>
                    
                    {/* Revenue & Budget Bar */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/50">Budget: £{camp.spend_k}k / £{camp.budget_k}k</span>
                        <span className="text-white/50">{spendPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-arsenal-red/60 rounded-full transition-all" style={{ width: `${spendPct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-400">Revenue: £{(camp.revenue_generated_k / 1000).toFixed(1)}M</span>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(camp.kpis).map(([k, v]) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                          {k.replace(/_/g, " ")}: <strong className="text-white/80">{String(v)}</strong>
                        </span>
                      ))}
                    </div>

                    {/* Channels */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {camp.channels.map((ch) => (
                        <span key={ch} className="text-[9px] px-1.5 py-0.5 rounded bg-arsenal-gold/5 border border-arsenal-gold/20 text-arsenal-gold/80">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Planned Campaigns */}
      {plannedCampaigns.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Planned Campaigns</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {plannedCampaigns.length} upcoming
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plannedCampaigns.map((camp) => {
              const Icon = typeIcons[camp.type] || Target;
              return (
                <div key={camp.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3">
                  <div className="p-1.5 rounded bg-amber-500/10">
                    <Icon className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{camp.name}</p>
                    <p className="text-xs text-white/40">{camp.type} · Starts {camp.start_date}</p>
                    <p className="text-xs text-white/50 mt-1">{camp.target_audience}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {camp.channels.map((ch) => (
                        <span key={ch} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{ch}</span>
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-white/30">£{camp.budget_k}k</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sponsorship Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-arsenal-gold" />
            <h2 className="text-lg font-semibold text-white">Sponsorship Portfolio</h2>
            <span className="ml-auto text-sm text-arsenal-gold font-bold">£{totalSponsorship}M</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 border-b border-white/10">
                  <th className="pb-2 pr-3">Partner</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Annual Value</th>
                  <th className="pb-2 pr-3">Expires</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.name} className="border-t border-white/5">
                    <td className="py-2.5 pr-3 text-white font-medium">{p.name}</td>
                    <td className="py-2.5 pr-3 text-white/60">{p.type}</td>
                    <td className="py-2.5 pr-3 text-white font-semibold">£{p.annual_value_m}M</td>
                    <td className="py-2.5 pr-3 text-white/50">{p.contract_end}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                        p.status === "renewal_pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                        "bg-white/5 text-white/40 border border-white/10"
                      }`}>
                        {p.status === "active" ? "Active" : p.status === "renewal_pending" ? "Renewal Pending" : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Pipeline</h2>
          </div>
          <div className="space-y-3">
            {pipeline.map((item) => (
              <div key={item.prospect} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-sm">{item.prospect}</p>
                    <p className="text-xs text-white/40">{item.type}</p>
                  </div>
                  <span className="text-blue-400 font-bold text-sm">£{item.est_value_m}M</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded-full"
                      style={{ width: `${item.probability_pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40">{item.probability_pct}%</span>
                </div>
                <p className="text-[10px] text-white/30 mt-1">{item.stage}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-medium">Pipeline Total</p>
            <p className="text-lg font-bold text-white">£{pipeline.reduce((s, p) => s + p.est_value_m, 0)}M</p>
            <p className="text-[10px] text-white/40">Weighted: £{pipeline.reduce((s, p) => s + p.est_value_m * p.probability_pct / 100, 0).toFixed(1)}M</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-arsenal-red" />
          <h2 className="text-lg font-semibold text-white">Revenue Streams Breakdown</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Matchday", value: "£145M", pct: 28, color: "bg-arsenal-red/60" },
            { label: "Broadcasting", value: "£210M", pct: 40, color: "bg-blue-500/60" },
            { label: "Commercial", value: "£185M", pct: 35, color: "bg-arsenal-gold/60" },
            { label: "Player Trading", value: "£42M", pct: 8, color: "bg-emerald-500/60" },
          ].map((stream) => (
            <div key={stream.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-white/50">{stream.label}</p>
              <p className="text-xl font-bold text-white mt-1">{stream.value}</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${stream.color}`} style={{ width: `${stream.pct * 2.5}%` }} />
              </div>
              <p className="text-[10px] text-white/30 mt-1">{stream.pct}% of total</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
