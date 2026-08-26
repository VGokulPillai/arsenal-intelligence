import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Users, Shield, Zap, Activity,
  Swords, BarChart3, Crosshair
} from "lucide-react";

const API = "/api/football";
const ARSENAL_ID = 42;

interface Fixture {
  fixture: { id: number; date: string; status: { long: string; short: string; elapsed: number | null } };
  league: { id: number; name: string; round: string; logo: string };
  teams: { home: { id: number; name: string; logo: string; winner: boolean | null }; away: { id: number; name: string; logo: string; winner: boolean | null } };
  goals: { home: number | null; away: number | null };
  score: { halftime: { home: number | null; away: number | null }; fulltime: { home: number | null; away: number | null } };
}

interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) return { response: [] };
  return r.json();
}

function FixtureCard({ fix, onClick, selected }: { fix: Fixture; onClick: () => void; selected: boolean }) {
  const d = new Date(fix.fixture.date);
  const status = fix.fixture.status;
  const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(status.short);
  const isFinished = ["FT", "AET", "PEN"].includes(status.short);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-3 rounded-xl border transition-all text-left ${
        selected
          ? "border-arsenal-red/50 bg-arsenal-red/10 shadow-lg shadow-arsenal-red/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/40">{fix.league.round}</span>
        {isLive && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-red-400 font-bold">{status.elapsed}&apos;</span>
          </span>
        )}
        {isFinished && <span className="text-[10px] text-white/30 font-medium">FT</span>}
        {!isLive && !isFinished && (
          <span className="text-[10px] text-white/40">{d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <img src={fix.teams.home.logo} alt="" className="w-6 h-6" />
        <span className={`text-xs flex-1 truncate ${fix.teams.home.id === ARSENAL_ID ? "text-white font-semibold" : "text-white/70"}`}>
          {fix.teams.home.name}
        </span>
        <span className="text-sm font-bold text-white min-w-[20px] text-right">
          {fix.goals.home ?? "-"}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <img src={fix.teams.away.logo} alt="" className="w-6 h-6" />
        <span className={`text-xs flex-1 truncate ${fix.teams.away.id === ARSENAL_ID ? "text-white font-semibold" : "text-white/70"}`}>
          {fix.teams.away.name}
        </span>
        <span className="text-sm font-bold text-white min-w-[20px] text-right">
          {fix.goals.away ?? "-"}
        </span>
      </div>
    </motion.button>
  );
}

function EventTimeline({ events }: { events: MatchEvent[] }) {
  const getIcon = (type: string, detail: string) => {
    if (type === "Goal") return detail === "Own Goal" ? "🔴" : "⚽";
    if (type === "Card" && detail === "Yellow Card") return "🟡";
    if (type === "Card" && detail === "Red Card") return "🔴";
    if (type === "subst") return "🔄";
    if (type === "Var") return "📺";
    return "•";
  };

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
      {events.map((ev, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className={`flex items-start gap-3 p-2 rounded-lg ${
            ev.type === "Goal" ? "bg-emerald-500/10 border border-emerald-500/20" :
            ev.type === "Card" ? "bg-amber-500/5 border border-amber-500/10" :
            "bg-white/[0.02] border border-white/5"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-[45px]">
            <span className="text-xs font-mono text-white/50">{ev.time.elapsed}&apos;</span>
            {ev.time.extra && <span className="text-[10px] text-white/30">+{ev.time.extra}</span>}
          </div>
          <span className="text-sm">{getIcon(ev.type, ev.detail)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <img src={ev.team.logo} alt="" className="w-4 h-4" />
              <span className="text-xs text-white font-medium truncate">{ev.player.name}</span>
            </div>
            {ev.assist?.name && (
              <p className="text-[10px] text-white/40 mt-0.5 ml-6">Assist: {ev.assist.name}</p>
            )}
            <p className="text-[10px] text-white/30 ml-6">{ev.detail}</p>
          </div>
        </motion.div>
      ))}
      {events.length === 0 && (
        <p className="text-white/30 text-sm text-center py-8">No events yet</p>
      )}
    </div>
  );
}

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white font-medium">{home}</span>
        <span className="text-white/50">{label}</span>
        <span className="text-white font-medium">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="bg-arsenal-red/70 transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="bg-blue-500/70 transition-all duration-500" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

function LineupPitch({ lineup }: { lineup: Record<string, unknown> }) {
  const formation = (lineup as { formation?: string }).formation || "4-3-3";
  const startXI = ((lineup as { startXI?: Array<{ player: { id: number; name: string; number: number; pos: string } }> }).startXI || []);
  const subs = ((lineup as { substitutes?: Array<{ player: { id: number; name: string; number: number; pos: string } }> }).substitutes || []);
  const team = (lineup as { team?: { id: number; name: string; logo: string } }).team;

  const lines = formation.split("-").map(Number);
  const rows = [1, ...lines]; // GK + formation lines

  let playerIdx = 0;
  const positionedPlayers = rows.map((count, rowIdx) => {
    const playersInRow = [];
    for (let i = 0; i < count; i++) {
      if (playerIdx < startXI.length) {
        playersInRow.push(startXI[playerIdx].player);
        playerIdx++;
      }
    }
    return { row: rowIdx, players: playersInRow };
  });

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-emerald-900/20 to-emerald-800/10 p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        {team && <img src={team.logo} alt="" className="w-5 h-5" />}
        <span className="text-white text-sm font-medium">{team?.name}</span>
        <span className="text-white/40 text-xs ml-auto">{formation}</span>
      </div>
      <div className="relative aspect-[3/4] max-h-[300px] rounded-lg bg-emerald-900/30 border border-emerald-700/20 overflow-hidden">
        {/* Field lines */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        <div className="absolute inset-x-[25%] top-[15%] bottom-[15%] border border-white/5 rounded" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/10 rounded-full" />

        {/* Players */}
        <div className="absolute inset-0 flex flex-col justify-between py-4 px-2">
          {positionedPlayers.map(({ row, players }) => (
            <div key={row} className="flex justify-around">
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: row * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-arsenal-red/80 border border-arsenal-gold/40 flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">{p.number}</span>
                  </div>
                  <span className="text-[8px] text-white/70 mt-0.5 max-w-[50px] truncate text-center">
                    {p.name.split(" ").pop()}
                  </span>
                </motion.div>
              ))}
            </div>
          )).reverse()}
        </div>
      </div>
      {/* Subs */}
      <div className="mt-3 flex flex-wrap gap-1">
        {subs.slice(0, 9).map((s) => (
          <span key={s.player.id} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
            {s.player.number} {s.player.name.split(" ").pop()}
          </span>
        ))}
      </div>
    </div>
  );
}

function H2HSection({ h2h }: { h2h: Fixture[] }) {
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {h2h.map((fix, i) => {
        const d = new Date(fix.fixture.date);
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[10px] text-white/30 min-w-[55px]">{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>
            <img src={fix.teams.home.logo} alt="" className="w-4 h-4" />
            <span className="text-[10px] text-white/60 truncate flex-1">{fix.teams.home.name}</span>
            <span className="text-xs font-bold text-white">{fix.goals.home} - {fix.goals.away}</span>
            <span className="text-[10px] text-white/60 truncate flex-1 text-right">{fix.teams.away.name}</span>
            <img src={fix.teams.away.logo} alt="" className="w-4 h-4" />
          </div>
        );
      })}
    </div>
  );
}

function PredictionPanel({ prediction }: { prediction: Record<string, unknown> }) {
  const predictions = (prediction as { predictions?: { winner?: { name: string; comment: string }; percent?: { home: string; draw: string; away: string } } }).predictions;
  const teams = (prediction as { teams?: { home: { name: string; logo: string }; away: { name: string; logo: string } } }).teams;

  if (!predictions || !teams) return null;

  const pcts = predictions.percent || { home: "0%", draw: "0%", away: "0%" };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-white/40 text-xs mb-1">AI Prediction</p>
        <p className="text-lg font-bold text-arsenal-gold">{predictions.winner?.name || "Draw"}</p>
        <p className="text-xs text-white/50 mt-1">{predictions.winner?.comment}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/70">{teams.home.name}</span>
            <span className="text-emerald-400 font-bold">{pcts.home}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: pcts.home }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/70">Draw</span>
            <span className="text-amber-400 font-bold">{pcts.draw}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-amber-500/60 rounded-full" style={{ width: pcts.draw }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/70">{teams.away.name}</span>
            <span className="text-blue-400 font-bold">{pcts.away}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-blue-500/60 rounded-full" style={{ width: pcts.away }} />
          </div>
        </div>
      </div>
    </div>
  );
}

type Tab = "events" | "lineups" | "stats" | "h2h" | "predictions";

export default function MatchCenter() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [lineups, setLineups] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>[]>([]);
  const [h2h, setH2H] = useState<Fixture[]>([]);
  const [prediction, setPrediction] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<Tab>("events");
  const [loading, setLoading] = useState(false);
  const [fixtureMode, setFixtureMode] = useState<"last" | "next">("last");

  useEffect(() => {
    const params = fixtureMode === "last" ? "last=10" : "next=10";
    fetchJson(`${API}/fixtures?team=${ARSENAL_ID}&${params}`).then((d) => {
      const fx = (d.response || []) as Fixture[];
      setFixtures(fx);
      if (fx.length > 0) setSelectedFixture(fx[0]);
    });
  }, [fixtureMode]);

  const loadFixtureData = useCallback(async (fix: Fixture) => {
    setLoading(true);
    const fid = fix.fixture.id;

    const [evData, luData, stData] = await Promise.all([
      fetchJson(`${API}/fixtures/events?fixture=${fid}`),
      fetchJson(`${API}/fixtures/lineups?fixture=${fid}`),
      fetchJson(`${API}/fixtures/statistics?fixture=${fid}`),
    ]);

    setEvents((evData.response || []) as MatchEvent[]);
    setLineups(luData.response || []);
    setStats(stData.response || []);

    const homeId = fix.teams.home.id;
    const awayId = fix.teams.away.id;
    const [h2hData, predData] = await Promise.all([
      fetchJson(`${API}/fixtures/headtohead?h2h=${homeId}-${awayId}&last=10`),
      fetchJson(`${API}/predictions?fixture=${fid}`),
    ]);
    setH2H((h2hData.response || []) as Fixture[]);
    setPrediction((predData.response || [])[0] || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedFixture) loadFixtureData(selectedFixture);
  }, [selectedFixture, loadFixtureData]);

  const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: "events", label: "Events", icon: Zap },
    { id: "lineups", label: "Lineups", icon: Users },
    { id: "stats", label: "Statistics", icon: BarChart3 },
    { id: "h2h", label: "Head to Head", icon: Swords },
    { id: "predictions", label: "Predictions", icon: Crosshair },
  ];

  const parseStat = (statArr: Record<string, unknown>[], type: string, teamIdx: number): number => {
    if (!statArr[teamIdx]) return 0;
    const statistics = (statArr[teamIdx] as { statistics?: Array<{ type: string; value: unknown }> }).statistics || [];
    const found = statistics.find((s) => s.type === type);
    if (!found) return 0;
    const v = found.value;
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseInt(v.replace("%", "")) || 0;
    return 0;
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Fixture List - Left Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="p-3 border-b border-white/10">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-arsenal-gold" />
            Arsenal Fixtures
          </h2>
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setFixtureMode("last")}
              className={`flex-1 py-1 rounded text-xs font-medium transition ${
                fixtureMode === "last" ? "bg-arsenal-red/20 text-white border border-arsenal-red/30" : "text-white/50 hover:text-white/70"
              }`}
            >
              Results
            </button>
            <button
              onClick={() => setFixtureMode("next")}
              className={`flex-1 py-1 rounded text-xs font-medium transition ${
                fixtureMode === "next" ? "bg-arsenal-red/20 text-white border border-arsenal-red/30" : "text-white/50 hover:text-white/70"
              }`}
            >
              Upcoming
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {fixtures.map((fix) => (
            <FixtureCard
              key={fix.fixture.id}
              fix={fix}
              onClick={() => setSelectedFixture(fix)}
              selected={selectedFixture?.fixture.id === fix.fixture.id}
            />
          ))}
        </div>
      </div>

      {/* Main Content - Right Panel */}
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        {selectedFixture ? (
          <>
            {/* Match Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-arsenal-red/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedFixture.league.logo} alt="" className="w-6 h-6" />
                  <div>
                    <p className="text-white/50 text-xs">{selectedFixture.league.name} • {selectedFixture.league.round}</p>
                    <p className="text-white/30 text-[10px]">
                      {new Date(selectedFixture.fixture.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {selectedFixture.fixture.status.short === "FT" && (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 text-xs">Full Time</span>
                )}
                {["1H", "2H", "HT"].includes(selectedFixture.fixture.status.short) && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE {selectedFixture.fixture.status.elapsed}&apos;
                  </span>
                )}
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className={`text-sm font-semibold ${selectedFixture.teams.home.id === ARSENAL_ID ? "text-white" : "text-white/70"}`}>
                    {selectedFixture.teams.home.name}
                  </span>
                  <img src={selectedFixture.teams.home.logo} alt="" className="w-10 h-10" />
                </div>
                <div className="px-5 py-2 rounded-xl bg-black/30 border border-white/10 min-w-[80px] text-center">
                  <span className="text-2xl font-bold text-white">
                    {selectedFixture.goals.home ?? "-"} — {selectedFixture.goals.away ?? "-"}
                  </span>
                  {selectedFixture.score.halftime.home !== null && (
                    <p className="text-[10px] text-white/30 mt-0.5">
                      HT: {selectedFixture.score.halftime.home} - {selectedFixture.score.halftime.away}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <img src={selectedFixture.teams.away.logo} alt="" className="w-10 h-10" />
                  <span className={`text-sm font-semibold ${selectedFixture.teams.away.id === ARSENAL_ID ? "text-white" : "text-white/70"}`}>
                    {selectedFixture.teams.away.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 px-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition ${
                    tab === id
                      ? "border-arsenal-red text-white"
                      : "border-transparent text-white/40 hover:text-white/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-3 text-white/40">
                    <Activity className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading match data...</span>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {tab === "events" && (
                    <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <EventTimeline events={events} />
                    </motion.div>
                  )}

                  {tab === "lineups" && (
                    <motion.div key="lineups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {lineups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {lineups.map((lu, i) => (
                            <LineupPitch key={i} lineup={lu} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/30 text-sm text-center py-8">Lineups not yet available</p>
                      )}
                    </motion.div>
                  )}

                  {tab === "stats" && (
                    <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {stats.length >= 2 ? (
                        <div className="space-y-3 max-w-lg mx-auto">
                          {["Ball Possession", "Total Shots", "Shots on Goal", "Shots off Goal",
                            "Corner Kicks", "Fouls", "Yellow Cards", "Passes %", "expected_goals"
                          ].map((type) => {
                            const h = parseStat(stats, type, 0);
                            const a = parseStat(stats, type, 1);
                            if (h === 0 && a === 0) return null;
                            return <StatBar key={type} label={type.replace("_", " ")} home={h} away={a} />;
                          })}
                        </div>
                      ) : (
                        <p className="text-white/30 text-sm text-center py-8">Statistics not available</p>
                      )}
                    </motion.div>
                  )}

                  {tab === "h2h" && (
                    <motion.div key="h2h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="mb-3 flex items-center gap-2">
                        <Swords className="w-4 h-4 text-arsenal-gold" />
                        <span className="text-sm text-white/70">Last {h2h.length} meetings</span>
                      </div>
                      <H2HSection h2h={h2h} />
                    </motion.div>
                  )}

                  {tab === "predictions" && (
                    <motion.div key="predictions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {prediction ? (
                        <PredictionPanel prediction={prediction} />
                      ) : (
                        <p className="text-white/30 text-sm text-center py-8">Predictions not available for this fixture</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p>Select a fixture to view match details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
