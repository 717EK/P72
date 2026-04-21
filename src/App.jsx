import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { msUntilMidnight } from './utils/dates';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import DashView from './components/visualizations/DashView';
import SkincareView from './components/skincare/SkincareView';
import FuelView from './components/diet/FuelView';
import LogView from './components/metrics/LogView';
import ToastHost, { toast } from './components/ui/Toast';
import WelcomeFlow from './components/onboarding/WelcomeFlow';
import PreStart from './components/onboarding/PreStart';
import './styles/global.css';

const VIEWS = {
  dash: DashView,
  skin: SkincareView,
  fuel: FuelView,
  log: LogView
};

export default function App() {
  const onboarded = useAppStore((s) => s.onboarded);
  const isPreStart = useAppStore((s) => s.isPreStart());
  const activeTab = useAppStore((s) => s.activeTab);
  const rolloverIfNeeded = useAppStore((s) => s.rolloverIfNeeded);
  const ActiveView = VIEWS[activeTab] || DashView;

  useEffect(() => {
    rolloverIfNeeded();
  }, [rolloverIfNeeded]);

  useEffect(() => {
    let timer;
    const schedule = () => {
      const ms = msUntilMidnight() + 50;
      timer = setTimeout(() => {
        rolloverIfNeeded();
        toast('NEW DAY INITIALIZED', 'info');
        schedule();
      }, ms);
    };
    schedule();

    const onVis = () => {
      if (document.visibilityState === 'visible') rolloverIfNeeded();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [rolloverIfNeeded]);

  // Not onboarded yet → full-screen welcome flow
  if (!onboarded) {
    return (
      <>
        <WelcomeFlow />
        <ToastHost />
      </>
    );
  }

  // Onboarded but start date is in the future → pre-start screen
  if (isPreStart) {
    return (
      <>
        <PreStart />
        <ToastHost />
      </>
    );
  }

  return (
    <div className="app-shell">
      <TopBar />
      <AnimatePresence mode="wait">
        <motion.main
          key={activeTab}
          className="scroll-area"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <ActiveView />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
      <ToastHost />
    </div>
  );
}
