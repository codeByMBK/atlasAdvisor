import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    icon: "🔌",
    title: "Connect",
    description:
      "Paste a MongoDB connection string, pick a sample database, or upload an exported JSON/BSON file. No schema migration or agent install required.",
    highlight: false,
  },
  {
    step: "02",
    icon: "⚡",
    title: "Analyse",
    description:
      "AtlasAdvisor inspects your collections, indexes, and document samples in seconds, running 10+ targeted checks against MongoDB best practices.",
    highlight: true,
  },
  {
    step: "03",
    icon: "🛠️",
    title: "Fix",
    description:
      "Get prioritised, copy-ready recommendations — from missing indexes to schema anti-patterns — with impact estimates and exact commands to run.",
    highlight: false,
  },
];

export function HowItWorks(): React.ReactElement {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-white dark:bg-slate-950"
    >
      <div className="container">
        <div className="section-heading">
          <div className="flex justify-center">
            <span className="tag">Simple 3-step process</span>
          </div>
          <h2 className="section-title mt-5">How It Works</h2>
          <p className="section-description mt-5">
            From zero to a full performance report in under 30 seconds.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-12">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`flex-1 rounded-3xl p-10 flex flex-col gap-4 border transition-shadow ${
                s.highlight
                  ? "bg-black dark:bg-white border-black dark:border-white shadow-2xl"
                  : "bg-white dark:bg-slate-800 border-black/10 dark:border-white/10 shadow-[0_7px_14px_#EAEAEA] dark:shadow-[0_7px_14px_rgba(0,0,0,0.4)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs font-bold tracking-widest ${s.highlight ? "text-white/50 dark:text-black/50" : "text-black/30 dark:text-white/30"}`}>
                  STEP {s.step}
                </span>
                <span className="text-3xl" aria-hidden="true">{s.icon}</span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight ${s.highlight ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                {s.title}
              </h3>
              <p className={`text-sm leading-relaxed ${s.highlight ? "text-white/75 dark:text-black/70" : "text-black/60 dark:text-white/60"}`}>
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link to="/analyse" className="btn btn-primary px-8 py-3 text-base">
            Start Analysing — It's Free
          </Link>
        </div>
      </div>
    </section>
  );
}
