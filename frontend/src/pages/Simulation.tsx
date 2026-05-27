import LiveTacticalBoard from "../components/LiveTacticalBoard";

export default function Simulation() {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-arsenal-red pl-4">
        <h1 className="text-3xl font-display tracking-widest text-white uppercase">
          Live Match Planning
        </h1>
        <p className="text-white/60 mt-1 max-w-3xl">
          Vertical pitch view: Arsenal (bottom) vs next-opponent style XI (top). Run the{" "}
          <strong>90-minute clock</strong>, <strong>drag players</strong> between slots to change shape, or pull from
          the bench to <strong>substitute</strong>. ML recommendations refresh in real time with the clock and sub count —
          use alongside <strong>Ask Genie</strong> for deeper tactical Q&A.
        </p>
      </div>
      <LiveTacticalBoard />
    </div>
  );
}
