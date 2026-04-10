import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

export function CTASection(): React.ReactElement {
  const ctaRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"],
  });
  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <section
      ref={ctaRef}
      className="bg-gradient-to-b from-white to-[#D2DCFF] dark:from-slate-900 dark:to-[#0f1f3d] py-24 overflow-x-clip"
    >
      <div className="container">
        <div className="section-heading relative">
          <h2 className="section-title">
            Start optimizing for free
          </h2>
          <p className="section-description mt-5 text-black/70 dark:text-white/60">
            No signup required. Connect your MongoDB database and get your first
            performance report in under 30 seconds.
          </p>

          <motion.img
            src="/decorative/star.png"
            alt=""
            aria-hidden="true"
            width={360}
            className="absolute -left-[350px] -top-[137px] hidden lg:block"
            style={{ translateY }}
          />
          <motion.img
            src="/decorative/spring.png"
            alt=""
            aria-hidden="true"
            width={360}
            className="absolute -right-[331px] -top-[19px] hidden lg:block"
            style={{ translateY }}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
          <Link to="/analyse" className="btn btn-primary px-8 py-3 text-base w-full sm:w-auto justify-center">
            Analyse My Database
          </Link>
          <Link
            to="/analyse"
            className="btn btn-text gap-2 text-black dark:text-white px-6 py-3 text-base w-full sm:w-auto justify-center"
          >
            <span>Try a sample database</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-8 text-sm text-black/40 dark:text-white/30">
          <span>✓ Read-only — never writes to your DB</span>
          <span>✓ No account required</span>
          <span>✓ Results in under 30 seconds</span>
        </div>
      </div>
    </section>
  );
}
