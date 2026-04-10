import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const FEATURES = [
  {
    icon: "⚡",
    title: "Index Recommendations",
    description: "Detect missing, redundant, and unused indexes across all collections. Get the exact createIndex() commands to run.",
  },
  {
    icon: "🗂️",
    title: "Schema Analysis",
    description: "Spot unbounded arrays, deeply nested documents, and mixed-type fields that hurt query performance.",
  },
  {
    icon: "🔍",
    title: "Query Pattern Insights",
    description: "Identify anti-patterns like repeated $lookup joins and full collection scans before they hit production.",
  },
  {
    icon: "📊",
    title: "Severity Scoring",
    description: "Every recommendation is scored HIGH, MEDIUM, or LOW so you know exactly where to focus first.",
  },
];

export function FeaturesShowcase(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="bg-gradient-to-b from-white to-[#D2DCFF] dark:from-slate-950 dark:to-[#0f1f3d] py-24 overflow-x-clip"
    >
      <div className="container">
        <div className="section-heading">
          <div className="flex justify-center">
            <span className="tag">What AtlasAdvisor checks</span>
          </div>
          <h2 className="section-title mt-5">
            Deep analysis, zero config
          </h2>
          <p className="section-description mt-5">
            Point AtlasAdvisor at any MongoDB database and instantly surface performance
            gaps across indexes, schema design, and query patterns.
          </p>
        </div>

        {/* Product screenshot */}
        <div className="relative mt-10">
          <figure className="rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-2xl ring-1 ring-white/5">
            <img
              src="/SecondaryImage.png"
              alt="AtlasAdvisor recommendation dashboard"
              className="block w-full h-auto object-contain object-center"
            />
          </figure>

          <motion.img
            src="/decorative/pyramid.png"
            alt=""
            aria-hidden="true"
            className="hidden md:block absolute -right-36 -top-32"
            height={262}
            width={262}
            style={{ translateY }}
          />
          <motion.img
            src="/decorative/tube.png"
            alt=""
            aria-hidden="true"
            className="hidden md:block absolute bottom-24 -left-36"
            height={248}
            width={248}
            style={{ translateY }}
          />
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="landing-card flex flex-col gap-3"
            >
              <span className="text-3xl" aria-hidden="true">{f.icon}</span>
              <h3 className="font-semibold text-black dark:text-white leading-snug">{f.title}</h3>
              <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
