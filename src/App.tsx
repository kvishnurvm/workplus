import React, { useState } from 'react';
import { WorkPulseProvider, useWorkPulse } from './context/WorkPulseContext';
import { Header } from './components/common/Header';
import { TrackerView } from './components/tracker/TrackerView';
import { LogsView } from './components/logs/LogsView';
import { WeeklyAnalytics } from './components/analytics/WeeklyAnalytics';
import { MasterSetupModal } from './components/master/MasterSetupModal';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import type { ActiveTab } from './types';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';
import './index.css';

const MainApp: React.FC = () => {
  const { isDbReady, dbError, retryInit } = useWorkPulse();
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracker');
  const [isMasterOpen, setIsMasterOpen] = useState(false);

  if (!isDbReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          gap: '16px',
          padding: '20px',
        }}
      >
        {dbError ? (
          <div
            className="card"
            style={{
              maxWidth: '420px',
              textAlign: 'center',
              padding: '24px',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              Database Initialization Failed
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {dbError}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
              onClick={retryInit}
            >
              <RefreshCw size={15} />
              <span>Retry Initialization</span>
            </button>
          </div>
        ) : (
          <>
            <div className="hero-pulse-dot" style={{ width: '28px', height: '28px', color: '#38bdf8' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                Work<span style={{ color: '#38bdf8' }}>Pulse</span> MASTER
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <Database size={13} color="var(--primary)" />
                <span>Initializing SQLite WebAssembly Database...</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <Header
        onOpenMaster={() => setIsMasterOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main View Router */}
      <main className="main-wrapper">
        {activeTab === 'tracker' && <TrackerView />}
        {activeTab === 'logs' && <LogsView />}
        {activeTab === 'analytics' && <WeeklyAnalytics />}
      </main>

      {/* Touch-Friendly Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMaster={() => setIsMasterOpen(true)}
      />

      {/* Master Timing & SQLite Setup Modal */}
      <MasterSetupModal
        isOpen={isMasterOpen}
        onClose={() => setIsMasterOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <WorkPulseProvider>
      <MainApp />
    </WorkPulseProvider>
  );
}
