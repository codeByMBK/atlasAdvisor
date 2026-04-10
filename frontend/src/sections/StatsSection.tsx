import React from "react";
import { motion } from "framer-motion";

const STATS = [
  {
    value: "10+",
    label: "Checks per database",
    description: "Indexes, schema, queries — every angle covered.",
    icon: "🔎",
  },
  {
    value: "3",
    label: "Connection modes",
    description: "Own connection string, sample DB, or file upload.",
    icon: "🔌",
  },
  {
    value: "< 30s",
    label: "Time to first insight",
    description: "Recommendations appear before your coffee cools.",
    icon: "⚡",
  },
  {
    value: "HIGH / MED / LOW",
    label: "Severity scoring",
    description: "Know exactly which fixes deliver the most impact.",
    icon: "📊",
  },
  {
    value: "100%",
    label: "Read-only analysis",
    description: "AtlasAdvisor never writes to your database.",
    icon: "🔒",
  },
  {
    value: "Free",
    label: "No credit card needed",
    description: "Open the app and start analysing right now.",
    icon: "🎉",
  },
];

export function StatsSection(): React.ReactElement {
  return (
    <section
      id="stats"
      className="py-24 bg-gradient-to-b from-[#D2DCFF] to-white dark:from-[#0f1f3d] dark:to-slate-950"
    >
      <div className="container">
        <div className="section-heading">
          <div className="flex justify-center">
            <span className="tag">By the numbers</span>
          </div>
          <h2 className="section-title mt-5">
            Built for real-world MongoDB
          </h2>
          <p className="section-description mt-5">
            AtlasAdvisor is designed to give you meaningful, actionable results — not generic advice.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="landing-card flex flex-col gap-2"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl font-bold tracking-tight text-black dark:text-white leading-none">
                  {s.value}
                </span>
                <span className="text-2xl" aria-hidden="true">{s.icon}</span>
              </div>
              <p className="text-sm font-semibold text-black/70 dark:text-white/70">{s.label}</p>
              <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
