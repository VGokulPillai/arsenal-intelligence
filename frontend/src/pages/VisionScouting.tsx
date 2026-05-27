import { motion } from "framer-motion";
import { Eye, Video, Brain } from "lucide-react";
import AnimatedCard from "../components/AnimatedCard";

export default function VisionScouting() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="border-l-4 border-arsenal-red pl-4">
        <h1 className="text-3xl font-display tracking-widest text-white uppercase">Vision Scouting</h1>
        <p className="text-white/70 mt-1">Computer vision-powered player scouting and match analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedCard delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-5 h-5 text-arsenal-gold" />
            <h3 className="font-semibold text-white uppercase tracking-wide text-sm">Video Analysis</h3>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-arsenal-red/20 flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-arsenal-gold" />
            </div>
            <p className="text-sm text-white/60">Upload match footage for AI-powered analysis</p>
            <button className="mt-4 px-4 py-2 bg-arsenal-red/20 border border-arsenal-red/30 rounded-lg text-sm text-white hover:bg-arsenal-red/30 transition-colors">
              Upload Video
            </button>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-arsenal-gold" />
            <h3 className="font-semibold text-white uppercase tracking-wide text-sm">Player Tracking</h3>
          </div>
          <div className="space-y-3">
            {[
              { metric: "Sprint Distance", value: "12.4 km" },
              { metric: "High-Intensity Runs", value: "847m" },
              { metric: "Passes Completed", value: "89%" },
              { metric: "Touches in Final Third", value: "34" },
            ].map((m, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/10">
                <span className="text-sm text-white/70">{m.metric}</span>
                <span className="text-sm text-arsenal-gold font-medium">{m.value}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-arsenal-gold" />
            <h3 className="font-semibold text-white uppercase tracking-wide text-sm">Scout Reports</h3>
          </div>
          <div className="space-y-3">
            {[
              { player: "Target A", rating: "8.4/10", note: "Exceptional ball progression" },
              { player: "Target B", rating: "7.9/10", note: "Strong aerial presence" },
              { player: "Target C", rating: "8.1/10", note: "Creative passing range" },
            ].map((s, i) => (
              <div key={i} className="p-2 rounded bg-white/5 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-sm text-white font-medium">{s.player}</span>
                  <span className="text-xs text-arsenal-gold">{s.rating}</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">{s.note}</p>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </motion.div>
  );
}
