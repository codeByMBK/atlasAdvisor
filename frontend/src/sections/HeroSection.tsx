import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroSection(): React.ReactElement {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });
  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <section
      ref={heroRef}
      className="pt-8 pb-20 md:pt-5 md:pb-10 overflow-x-clip
        bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#6ea8fe,#eef2ff_60%)]
        dark:bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#0f3460,#020617_100%)]"
    >
      <div className="container">
        <div className="md:flex items-center">
          {/* Left: copy */}
          <div className="md:w-[478px]">
            <div className="tag w-fit mb-6">MongoDB Performance Advisor</div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mt-6
              bg-gradient-to-b from-[#001060] to-[#183EC2]
              dark:from-white dark:to-[#00ED64]
              text-transparent bg-clip-text"
            >
              Instant MongoDB insights
            </h1>
            <p className="text-xl text-[#1a2a6e] dark:text-[#EAEEFE] tracking-tight mt-6">
              Connect any MongoDB database and get actionable recommendations for
              indexes, schema design, and query patterns — in seconds.
            </p>
            <div className="flex gap-4 items-center mt-[30px]">
              <Link to="/analyse" className="btn btn-primary">
                Analyse My DB
              </Link>
              <a href="#how-it-works" className="btn btn-text gap-2 text-[#1a2a6e] dark:text-white">
                <span>See how it works</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right: animated decoratives */}
          <div className="mt-20 md:mt-0 md:h-[648px] md:flex-1 relative">
            <motion.img
              src="/decorative/cog.png"
              alt=""
              aria-hidden="true"
              className="md:absolute md:h-full md:w-auto md:max-w-none md:-left-6"
              animate={{ translateY: [-30, 30] }}
              transition={{
                repeat: Infinity,
                repeatType: "mirror",
                duration: 3,
                ease: "easeInOut",
              }}
            />
            <motion.img
              src="/decorative/cylinder.png"
              width={220}
              height={220}
              alt=""
              aria-hidden="true"
              className="hidden md:block md:absolute -top-28 -left-32"
              style={{ translateY }}
            />
            <motion.img
              src="/decorative/noodle.png"
              width={220}
              alt=""
              aria-hidden="true"
              className="hidden lg:block absolute top-[568px] -right-36"
              style={{ rotate: 30, translateY }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
