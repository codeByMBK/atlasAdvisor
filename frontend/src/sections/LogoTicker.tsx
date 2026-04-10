import React from "react";
import { motion } from "framer-motion";

const TECH_BADGES = [
  { label: "MongoDB", color: "#00ED64" },
  { label: "Atlas", color: "#00684A" },
  { label: "Mongoose", color: "#880000" },
  { label: "Node.js", color: "#339933" },
  { label: "Express", color: "#888888" },
  { label: "Docker", color: "#2496ED" },
  { label: "TypeScript", color: "#3178C6" },
  { label: "React", color: "#61DAFB" },
];

// Duplicate for seamless loop
const BADGES = [...TECH_BADGES, ...TECH_BADGES];

function Badge({ label, color }: { label: string; color: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm whitespace-nowrap">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-black/80 dark:text-white/80">{label}</span>
    </div>
  );
}

export function LogoTicker(): React.ReactElement {
  return (
    <div className="py-8 md:py-12 bg-white dark:bg-slate-900/50 border-y border-black/5 dark:border-white/5">
      <div className="container mb-6">
        <p className="text-center text-sm text-black/50 dark:text-white/40 font-medium tracking-widest uppercase">
          Built for the MongoDB ecosystem
        </p>
      </div>
      <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <motion.div
          className="flex gap-5 flex-none pr-5"
          animate={{ translateX: "-50%" }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          }}
        >
          {BADGES.map((badge, i) => (
            <Badge key={`${badge.label}-${i}`} label={badge.label} color={badge.color} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
