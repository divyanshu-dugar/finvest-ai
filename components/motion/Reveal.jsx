'use client';

import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

/** Fades and lifts its children into view once, the first time they scroll on screen. */
export default function Reveal({ as = 'div', children, delay = 0, y = 16, className }) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}
