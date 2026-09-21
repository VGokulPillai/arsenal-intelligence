const API_BASE = "/api";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  executive: {
    summary: () => fetchApi<Record<string, unknown>>("/executive/summary"),
    alerts: () => fetchApi<Array<Record<string, unknown>>>("/executive/alerts"),
    fixtures: () =>
      fetchApi<Array<Record<string, unknown>>>(
        `/executive/upcoming-fixtures?t=${Date.now()}`
      ),
    matchdayInsights: () => fetchApi<Record<string, unknown>>("/executive/matchday-insights"),
  },
  audience: {
    predictions: () => fetchApi<Array<Record<string, unknown>>>("/audience/predictions"),
    segments: () => fetchApi<Array<Record<string, unknown>>>("/audience/fan-segments"),
    heatmap: () => fetchApi<Array<Record<string, unknown>>>("/audience/demand-heatmap"),
  },
  revenue: {
    projections: () => fetchApi<Array<Record<string, unknown>>>("/revenue/projections"),
    recommendations: () => fetchApi<Array<Record<string, unknown>>>("/revenue/recommendations"),
    mlStrategies: () => fetchApi<Record<string, unknown>>("/revenue/ml-strategies"),
    campaigns: () => fetchApi<Array<Record<string, unknown>>>("/revenue/campaigns"),
    sponsorship: () => fetchApi<Record<string, unknown>>("/revenue/sponsorship"),
    simulate: (fixtureId: string, pct: number) =>
      fetch(
        `${API_BASE}/revenue/simulate?${new URLSearchParams({
          fixture_id: fixtureId,
          price_change_pct: String(pct),
        })}`,
        { method: "POST" }
      ).then((r) => {
        if (!r.ok) throw new Error(`Simulate failed: ${r.status}`);
        return r.json();
      }),
  },
  players: {
    list: () => fetchApi<Array<Record<string, unknown>>>("/players"),
    get: (id: string) => fetchApi<Record<string, unknown>>(`/players/${id}`),
    performance: () => fetchApi<Array<Record<string, unknown>>>("/players/performance/summary"),
    health: () => fetchApi<Array<Record<string, unknown>>>("/players/health/status"),
  },
  transfers: {
    targets: () => fetchApi<Array<Record<string, unknown>>>("/transfers/targets"),
  },
  squadValue: {
    squad: () => fetchApi<Record<string, unknown>>("/squad-value/squad"),
    transferPotential: () => fetchApi<Record<string, unknown>>("/squad-value/transfer-potential"),
  },
  media: {
    sentiment: () => fetchApi<Array<Record<string, unknown>>>("/media/sentiment"),
    trending: () => fetchApi<Array<Record<string, unknown>>>("/media/trending"),
    news: () => fetchApi<Array<Record<string, unknown>>>("/media/news-summary"),
    transferNews: () =>
      fetchApi<{ articles: Array<Record<string, unknown>>; source: string }>("/media/transfer-news"),
    matchReports: () =>
      fetchApi<{ articles: Array<Record<string, unknown>>; source: string }>("/media/match-reports"),
    newsInsights: () =>
      fetchApi<{
        injuries: Array<Record<string, unknown>>;
        transfers_in: Array<Record<string, unknown>>;
        transfers_out: Array<Record<string, unknown>>;
        summary: string;
        source: string;
      }>("/media/news-insights"),
  },
  copilot: {
    ask: (message: string) =>
      fetch(`${API_BASE}/copilot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }).then((r) => r.json()),
  },
  weather: {
    current: () => fetchApi<Record<string, unknown>>("/weather/current"),
    forecast: () => fetchApi<Record<string, unknown>>("/weather/forecast"),
  },
  simulation: {
    injury: (playerIds: string[], weeks: number) =>
      fetch(`${API_BASE}/simulation/injury`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_ids: playerIds, duration_weeks: weeks }),
      }).then((r) => r.json()),
    pricing: (fixtureId: string, pct: number) =>
      fetch(`${API_BASE}/simulation/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixture_id: fixtureId, price_change_pct: pct }),
      }).then((r) => r.json()),
  },
  football: {
    media: {
      playerPhoto: (id: number) => `https://media.api-sports.io/football/players/${id}.png`,
      teamLogo: (id: number) => `https://media.api-sports.io/football/teams/${id}.png`,
      leagueLogo: (id: number) => `https://media.api-sports.io/football/leagues/${id}.png`,
      venueImage: (id: number) => `https://media.api-sports.io/football/venues/${id}.png`,
    },
    arsenal: {
      squad: (season?: number) =>
        fetchApi<Record<string, unknown>>(`/football/arsenal/squad${season ? `?season=${season}` : ""}`),
      fixtures: (next?: number) =>
        fetchApi<Record<string, unknown>>(`/football/arsenal/fixtures${next ? `?next=${next}` : ""}`),
      standings: (season?: number) =>
        fetchApi<Record<string, unknown>>(`/football/arsenal/standings${season ? `?season=${season}` : ""}`),
      playerPerformanceLive: (season?: number) =>
        fetchApi<Record<string, unknown>>(
          `/football/arsenal/player-performance-live${season != null ? `?season=${season}` : ""}`
        ),
    },
    fixtures: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/fixtures?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    players: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/players?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    standings: (league: number, season: number) =>
      fetchApi<Record<string, unknown>>(`/football/standings?league=${league}&season=${season}`),
    currentSeason: (league?: number) =>
      fetchApi<{ league: number; season: number }>(`/football/leagues/current-season${league != null ? `?league=${league}` : ""}`),
    teams: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/teams?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    injuries: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/injuries?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    transfers: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/transfers?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    predictions: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/predictions?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    topScorers: (league: number, season: number) =>
      fetchApi<Record<string, unknown>>(`/football/players/topscorers?league=${league}&season=${season}`),
    topAssists: (league: number, season: number) =>
      fetchApi<Record<string, unknown>>(`/football/players/topassists?league=${league}&season=${season}`),
    leagues: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/leagues?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    venues: (params?: Record<string, string | number>) =>
      fetch(`${API_BASE}/football/venues?${new URLSearchParams(params as Record<string, string>).toString()}`).then((r) => r.json()),
    status: () => fetchApi<Record<string, unknown>>("/football/status"),
  },
  ml: {
    predictAttendance: (params: Record<string, unknown>) =>
      fetch(`${API_BASE}/ml/predict-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }).then((r) => r.json()),
    predictInjuryRisk: (params: Record<string, unknown>) =>
      fetch(`${API_BASE}/ml/predict-injury-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }).then((r) => r.json()),
    matchPredictions: (fixtureId?: number) =>
      fetchApi<Record<string, unknown>>(
        `/ml/match-predictions${fixtureId ? `?fixture_id=${fixtureId}` : ""}`
      ),
    tacticalLive: (
      minute: number,
      subsUsed?: number,
      formationId?: string,
      fatigueSlots?: string,
      slotRoles?: string
    ) => {
      const p = new URLSearchParams();
      p.set("minute", String(minute));
      p.set("subs_used", String(subsUsed ?? 0));
      if (formationId) p.set("formation_id", formationId);
      if (fatigueSlots) p.set("fatigue_slots", fatigueSlots);
      if (slotRoles) p.set("slot_roles", slotRoles);
      return fetchApi<Record<string, unknown>>(`/ml/tactical-live?${p.toString()}`);
    },
  },
  fanOps: {
    dashboard: (params?: Record<string, string>) =>
      fetchApi<Record<string, unknown>>(
        `/fan-ops/dashboard${params ? `?${new URLSearchParams(params).toString()}` : ""}`
      ),
    fixtures: () => fetchApi<Array<Record<string, unknown>>>("/fan-ops/fixtures"),
    groups: (params?: Record<string, string>) =>
      fetchApi<Array<Record<string, unknown>>>(
        `/fan-ops/groups${params ? `?${new URLSearchParams(params).toString()}` : ""}`
      ),
    group: (groupId: string, fixtureId?: string) =>
      fetchApi<Record<string, unknown>>(
        `/fan-ops/groups/${groupId}${fixtureId ? `?fixture_id=${fixtureId}` : ""}`
      ),
    groupFans: (groupId: string, fixtureId?: string) =>
      fetchApi<Array<Record<string, unknown>>>(
        `/fan-ops/groups/${groupId}/fans${fixtureId ? `?fixture_id=${fixtureId}` : ""}`
      ),
    issues: (params?: Record<string, string>) =>
      fetchApi<Array<Record<string, unknown>>>(
        `/fan-ops/issues${params ? `?${new URLSearchParams(params).toString()}` : ""}`
      ),
    updateTicketStatus: (ticketId: string, status: string) =>
      fetch(`${API_BASE}/fan-ops/tickets/${ticketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    checkin: (data: { ticket_id: string; fan_id: string; fixture_id: string; gate: string }) =>
      fetch(`${API_BASE}/fan-ops/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    createIssue: (data: { fan_group_id: string; fixture_id: string; issue_type: string; description: string }) =>
      fetch(`${API_BASE}/fan-ops/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    updateIssue: (issueId: string, status: string) =>
      fetch(`${API_BASE}/fan-ops/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    createNote: (data: { entity_type: string; entity_id: string; fixture_id?: string; note: string; author?: string }) =>
      fetch(`${API_BASE}/fan-ops/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    notes: (params?: Record<string, string>) =>
      fetchApi<Array<Record<string, unknown>>>(
        `/fan-ops/notes${params ? `?${new URLSearchParams(params).toString()}` : ""}`
      ),
  },
};
