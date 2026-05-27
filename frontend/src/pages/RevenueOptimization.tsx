import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import KPITile from "../components/KPITile";
import { Sparkles, Loader2 } from "lucide-react";

function rationaleTitle(lines: unknown): string {
  if (!lines || !Array.isArray(lines)) return "";
  return lines.map((x) => String(x)).join(" ");
}

export default function RevenueOptimization() {
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [recommendations, setRecommendations] = useState<Array<Record<string, unknown>>>([]);
  const [fixtureId, setFixtureId] = useState<string>("");
  const [pricePct, setPricePct] = useState<number>(5);
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    api.executive.matchdayInsights().then(setInsights).catch(() => setInsights(null));
    api.revenue.recommendations().then(setRecommendations).catch(() => {});
  }, []);

  const projections = (insights?.upcoming_home_revenue ?? []) as Array<Record<string, unknown>>;
  const totalProjected = Number(insights?.total_projected_revenue_upcoming_homes_m ?? 0);
  const totalHistorical = Number(insights?.total_historical_home_revenue_m ?? 0);
  const prevFixtures = (insights?.previous_fixtures ?? []) as Array<Record<string, unknown>>;
  const nextFx = (insights?.next_fixture ?? null) as Record<string, unknown> | null;
  const mlStrategies = (insights?.ml_revenue_strategies ?? []) as Array<Record<string, unknown>>;
  const totalRationale = insights?.total_projected_revenue_rationale;

  useEffect(() => {
    if (!fixtureId && projections.length > 0) {
      setFixtureId(String(projections[0].fixture_id ?? "f2"));
    }
  }, [projections, fixtureId]);

  const totalProjectedHint = useMemo(() => rationaleTitle(totalRationale), [totalRationale]);

  const runSimulate = async () => {
    const fid = fixtureId || String(projections[0]?.fixture_id ?? "f2");
    setSimLoading(true);
    setSimError(null);
    setSimResult(null);
    try {
      const data = await api.revenue.simulate(fid, pricePct);
      setSimResult(data as Record<string, unknown>);
    } catch (e) {
      setSimError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-arsenal-red pl-4">
        <h1 className="text-3xl font-display tracking-widest text-white uppercase">
          Revenue Optimization
        </h1>
        <p className="text-white/60 mt-1">
          Projected matchday revenue with model rationale. ML strategies and pricing simulation below.
        </p>
        {nextFx != null && nextFx.opponent != null && (
          <p className="text-sm text-arsenal-gold mt-2 font-medium">
            Next fixture: {String(nextFx.opponent)} · {String(nextFx.date)} ({String(nextFx.venue)})
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPITile
          title="Total projected revenue"
          value={`£${totalProjected.toFixed(2)}M`}
          subtitle="All upcoming home fixtures on the schedule"
          valueHint={totalProjectedHint || "Hover for narrative — see commercial context in Genie answers."}
        />
        <KPITile
          title="Historical home (sample)"
          value={`£${totalHistorical.toFixed(2)}M`}
          subtitle="Reported matchday total — recent Emirates matches"
          valueHint="Sum of modelled £M for recent home results (context for calibration, not forecast)."
        />
        <KPITile
          title="Home fixtures in outlook"
          value={String(projections.length)}
          subtitle="Rows in projection table below"
          valueHint="Each row is an Emirates fixture with ticket / hospitality / F&B split from the demand model."
        />
      </div>

      {mlStrategies.length > 0 && (
        <div className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-arsenal-gold" />
            <h2 className="text-lg font-semibold text-white">ML & analytics strategies to grow revenue</h2>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Prioritized levers from the platform model (same context is injected into Ask Genie for commercial questions).
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mlStrategies.map((s, i) => (
              <li
                key={i}
                className="p-4 rounded-lg bg-white/[0.08] border border-white/10"
                title={String(s.rationale ?? "")}
              >
                <p className="font-semibold text-white">{String(s.title)}</p>
                <p className="text-sm text-white/80 mt-1">{String(s.rationale)}</p>
                <div className="flex justify-between mt-2 text-xs text-white/50">
                  <span>Est. lift ~+{Number(s.expected_revenue_lift_pct ?? 0)}%</span>
                  <span>{String(s.owner ?? "")}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass">
          <h2 className="text-lg font-semibold text-white mb-1">Revenue by upcoming home fixture</h2>
          <p className="text-sm text-white/50 mb-4">
            Hover the £M figure for model reasoning. Ask Genie: &quot;Why is projected revenue £X for [opponent]?&quot;
          </p>
          <div className="space-y-4">
            {projections.length === 0 && (
              <p className="text-white/50 text-sm">No home fixtures in the upcoming window.</p>
            )}
            {projections.map((p, i) => {
              const lines = p.revenue_rationale as string[] | undefined;
              const hint = lines?.length ? lines.join(" ") : String(p.revenue_rationale_summary ?? "");
              return (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div>
                      <span className="font-medium text-white">{String(p.opponent)}</span>
                      <span className="text-white/50 text-sm ml-2">{String(p.date)}</span>
                      {p.demand_tier != null && (
                        <span className="text-xs text-white/50 ml-2">· {String(p.demand_tier)}</span>
                      )}
                    </div>
                    <span
                      className="text-white font-semibold cursor-help border-b border-dotted border-arsenal-red/50"
                      title={hint}
                    >
                      £{Number(p.projected_revenue_m ?? 0).toFixed(2)}M
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-white/60">
                    <span title="Ticket yield from forecast gate × category mix">Ticket: £{Number(p.ticket_revenue ?? 0).toFixed(2)}M</span>
                    <span title="Hospitality attach rate scales with opponent draw tier">Hosp: £{Number(p.hospitality ?? 0).toFixed(2)}M</span>
                    <span title="F&B scales with expected footfall">Conc: £{Number(p.concessions ?? 0).toFixed(2)}M</span>
                  </div>
                  <p className="text-xs text-arsenal-gold mt-2">
                    Band: {String(p.optimal_price_band)}
                    {p.predicted_attendance != null && (
                      <span className="text-white/50 ml-2">· ~{Number(p.predicted_attendance).toLocaleString()} att.</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass">
          <h2 className="text-lg font-semibold text-white mb-4">Marketing recommendations</h2>
          <div className="space-y-4">
            {recommendations.map((r, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{String(r.fixture)}</p>
                    <p className="text-sm text-arsenal-gold mt-1">{String(r.action)}</p>
                  </div>
                  <span className="text-emerald-400 text-sm font-medium">
                    +{Number(r.expected_lift_pct ?? 0)}% lift
                  </span>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-white/50">
                  <span>Segment: {String(r.segment)}</span>
                  <span>•</span>
                  <span>Channel: {String(r.channel)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass">
        <h2 className="text-lg font-semibold text-white mb-1">Previous matches — matchday revenue</h2>
        <p className="text-sm text-white/50 mb-4">
          Home rows are full Emirates estimates; away rows show travelling / commercial allocation only
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 border-b border-white/10">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Opponent</th>
                <th className="pb-2 pr-4">H/A</th>
                <th className="pb-2 pr-4">Score</th>
                <th className="pb-2">Matchday £M</th>
              </tr>
            </thead>
            <tbody>
              {prevFixtures.map((p, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="py-2 pr-4 text-white/60">{String(p.date)}</td>
                  <td className="py-2 pr-4 font-medium text-white">{String(p.opponent)}</td>
                  <td className="py-2 pr-4">{p.is_home ? "H" : "A"}</td>
                  <td className="py-2 pr-4">{String(p.score)}</td>
                  <td className="py-2">£{Number(p.matchday_revenue_m ?? 0).toFixed(2)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card !rounded-xl p-6 border border-white/[0.12] shadow-glass">
        <h2 className="text-lg font-semibold text-white mb-1">What-if pricing simulation</h2>
        <p className="text-white/60 text-sm mb-4">
          Uses elasticity priors from the platform (attendance vs ticket price; hospitality less elastic). Results include
          ML growth ideas you can discuss with Genie.
        </p>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm text-white/60 mb-1">Fixture</label>
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white min-w-[10rem]"
              value={fixtureId}
              onChange={(e) => setFixtureId(e.target.value)}
            >
              {projections.map((p, i) => (
                <option key={i} value={String(p.fixture_id ?? i)}>
                  {String(p.opponent)} ({String(p.date)})
                </option>
              ))}
              {projections.length === 0 && <option value="demo">Next home (demo)</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Price change %</label>
            <input
              type="number"
              step={0.5}
              value={pricePct}
              onChange={(e) => setPricePct(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white w-28"
            />
          </div>
          <button
            type="button"
            onClick={runSimulate}
            disabled={simLoading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-arsenal-red text-white font-semibold rounded-lg hover:bg-arsenal-red/80 disabled:opacity-60"
          >
            {simLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Simulate
          </button>
        </div>

        {simError && <p className="mt-4 text-sm text-rose-400">{simError}</p>}

        {simResult && (
          <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-white/5">
                <span className="text-white/50 block text-xs">Baseline £M</span>
                <span className="font-semibold text-lg text-white">{Number(simResult.base_revenue_m ?? 0).toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/10">
                <span className="text-white/60 block text-xs">Simulated £M</span>
                <span className="font-semibold text-lg text-white">
                  {Number(simResult.simulated_revenue_m ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <span className="text-white/50 block text-xs">Attendance impact</span>
                <span className="font-semibold text-white">{Number(simResult.estimated_attendance_impact_pct ?? 0).toFixed(1)}%</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <span className="text-white/50 block text-xs">Revenue impact</span>
                <span className="font-semibold text-white">{Number(simResult.estimated_revenue_impact_pct ?? 0).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-white/90">{String(simResult.recommendation ?? "")}</p>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Model reasoning</h3>
              <ul className="list-disc pl-5 text-sm text-white/80 space-y-1">
                {(simResult.explanation as string[] | undefined)?.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
            {(simResult.ml_growth_strategies as Array<Record<string, unknown>> | undefined)?.length ? (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Suggested ML / commercial follow-ups</h3>
                <ul className="space-y-2">
                  {(simResult.ml_growth_strategies as Array<Record<string, unknown>>).map((s, i) => (
                    <li key={i} className="text-sm p-3 rounded-lg bg-white/5 border border-white/10">
                      <span className="font-medium text-white">{String(s.title)}</span>
                      <span className="text-emerald-400 text-xs ml-2">~+{Number(s.expected_revenue_lift_pct ?? 0)}%</span>
                      <p className="text-white/60 mt-1">{String(s.rationale)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
