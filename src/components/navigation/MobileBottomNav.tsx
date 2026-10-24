import React from 'react';
import type { ActiveTab } from '../../types';
import { Clock, Calendar, BarChart3, Sliders } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMaster: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMaster,
}) => {
  return (
    <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
        onClick={() => setActiveTab('tracker')}
      >
        <Clock size={20} />
        <span>Tracker</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
        onClick={() => setActiveTab('logs')}
      >
        <Calendar size={20} />
        <span>Logs</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('analytics')}
      >
        <BarChart3 size={20} />
        <span>Analytics</span>
      </button>

      <button
        type="button"
        className="bottom-nav-item"
        onClick={onOpenMaster}
      >
        <Sliders size={20} />
        <span>Master</span>
      </button>
    </nav>
  );
};
