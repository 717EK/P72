import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import './SwipeRow.css';

const THRESHOLD = 80;

export default function SwipeRow({ checked, onComplete, onMiss, children }) {
  const [flash, setFlash] = useState(null);
  const x = useMotionValue(0);

  const bgColor = useTransform(
    x,
    [-THRESHOLD * 1.5, -20, 0, 20, THRESHOLD * 1.5],
    ['rgba(255,0,60,0.35)', 'rgba(255,0,60,0.05)', 'rgba(0,0,0,0)', 'rgba(57,255,20,0.05)', 'rgba(57,255,20,0.35)']
  );

  const handleDragEnd = (_, info) => {
    const dx = info.offset.x;
    if (dx > THRESHOLD) {
      setFlash('ok');
      animate(x, [dx, THRESHOLD * 2, 0], { duration: 0.35, times: [0, 0.15, 1] });
      onComplete && onComplete();
      setTimeout(() => setFlash(null), 320);
    } else if (dx < -THRESHOLD) {
      setFlash('bad');
      animate(x, [dx, -THRESHOLD * 2, 0], { duration: 0.35, times: [0, 0.15, 1] });
      onMiss && onMiss();
      setTimeout(() => setFlash(null), 320);
    } else {
      animate(x, 0, { duration: 0.2 });
    }
  };

  return (
    <div className={`swipe-wrap${flash ? ' flash-' + flash : ''}`}>
      <div className="swipe-bg-l" aria-hidden>MISS</div>
      <div className="swipe-bg-r" aria-hidden>DONE</div>
      <motion.div
        className="swipe-inner"
        drag="x"
        dragConstraints={{ left: -160, right: 160 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, backgroundColor: bgColor }}
      >
        {children}
      </motion.div>
    </div>
  );
}
