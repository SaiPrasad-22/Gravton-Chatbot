import type { ReactNode } from 'react';
import { FULL_SPECS_URL } from '../../config';
import {
  BATTERY_INTRO,
  BATTERY_ROWS,
  PERFORMANCE_ROWS,
  QUANTA_STATS,
  SAFETY_ITEMS,
  type Row,
} from '../../data/quanta';
import { QUANTA_ENQUIRY_MESSAGE, TOPIC_MESSAGES } from '../../services/whatsapp';
import { BackButton } from './BackButton';
import { ArrowIcon } from './Icons';
import { WhatsAppAction } from './WhatsAppAction';

export type QuantaTopic = 'battery' | 'performance' | 'safety';

interface QuantaProps {
  onBack: () => void;
  onMainMenu: () => void;
  onOpenTopic: (topic: QuantaTopic) => void;
  onBookRide: () => void;
  onAskAssistant: () => void;
}

function InfoCard({ icon, title, detail, onClick }: { icon: string; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" className="gv-info-card" onClick={onClick}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      <ArrowIcon />
    </button>
  );
}

export function QuantaScreen({ onBack, onMainMenu, onOpenTopic, onBookRide, onAskAssistant }: QuantaProps) {
  return (
    <div className="gv-screen">
      <div className="gv-chat-top gv-flow-nav">
        <BackButton onClick={onBack} />
        <button type="button" className="gv-link-btn" onClick={onMainMenu}>Main menu</button>
      </div>
      <div className="gv-titles">
        <h3 className="gv-h3 gv-h3b">Explore Quanta S+</h3>
        <p className="gv-p gv-p-s">Built for performance. Built for India.</p>
      </div>
      <div className="gv-product">
        <div className="gv-product-title">Quanta S+</div>
        <div className="gv-product-sub">Our higher-range Quanta</div>
        <div className="gv-stats">
          {QUANTA_STATS.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
      <InfoCard icon="🔋" title="Battery & Charging" detail="3.8 kWh LMFP battery" onClick={() => onOpenTopic('battery')} />
      <InfoCard icon="⚡" title="Performance" detail="4 kW · 172 Nm · 33% gradability" onClick={() => onOpenTopic('performance')} />
      <InfoCard icon="🛡" title="Safety & Build" detail="Rib-caged chassis · Dual disc CBS" onClick={() => onOpenTopic('safety')} />
      <InfoCard
        icon="📋"
        title="Full Specifications"
        detail="View the complete Quanta details"
        onClick={() => window.open(FULL_SPECS_URL, '_blank')}
      />
      <WhatsAppAction className="gv-wa gv-small-wa" label="Ask about Quanta S+" message={QUANTA_ENQUIRY_MESSAGE} />
      <button type="button" className="gv-secondary-btn" onClick={onAskAssistant}>
        Ask Gravton AI
      </button>
      <button type="button" className="gv-secondary-btn" onClick={onBookRide}>
        Book a Test Ride
      </button>
    </div>
  );
}

function TopicScreen({
  title,
  subtitle,
  onBack,
  onMainMenu,
  children,
  topic,
  label,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  onMainMenu: () => void;
  children: ReactNode;
  topic: QuantaTopic;
  label: string;
}) {
  return (
    <div className="gv-screen">
      <div className="gv-chat-top gv-flow-nav">
        <BackButton onClick={onBack} />
        <button type="button" className="gv-link-btn" onClick={onMainMenu}>Main menu</button>
      </div>
      <div className="gv-titles">
        <h3 className="gv-h3 gv-h3b">{title}</h3>
        <p className="gv-p gv-p-s">{subtitle}</p>
      </div>
      {children}
      <WhatsAppAction label={label} message={TOPIC_MESSAGES[topic]} />
    </div>
  );
}

function AnswerRows({ rows }: { rows: readonly Row[] }) {
  return (
    <>
      {rows.map((row) => (
        <div key={row.label} className="gv-answer-row">
          <span>{row.label}</span>
          <b>{row.value}</b>
        </div>
      ))}
    </>
  );
}

export function BatteryScreen({ onBack, onMainMenu }: { onBack: () => void; onMainMenu: () => void }) {
  return (
    <TopicScreen title="Battery & Charging" subtitle="Quanta S+" onBack={onBack} onMainMenu={onMainMenu} topic="battery" label="Ask about Battery">
      <div className="gv-answer">
        <strong>🔋 3.8 kWh LMFP Battery</strong>
        <p>{BATTERY_INTRO}</p>
        <AnswerRows rows={BATTERY_ROWS} />
      </div>
    </TopicScreen>
  );
}

export function PerformanceScreen({ onBack, onMainMenu }: { onBack: () => void; onMainMenu: () => void }) {
  return (
    <TopicScreen title="Performance" subtitle="Quanta S+" onBack={onBack} onMainMenu={onMainMenu} topic="performance" label="Ask about Performance">
      <div className="gv-answer">
        <AnswerRows rows={PERFORMANCE_ROWS} />
      </div>
    </TopicScreen>
  );
}

export function SafetyScreen({ onBack, onMainMenu }: { onBack: () => void; onMainMenu: () => void }) {
  return (
    <TopicScreen title="Safety & Build" subtitle="Built for Indian roads." onBack={onBack} onMainMenu={onMainMenu} topic="safety" label="Ask Gravton on WhatsApp">
      <div className="gv-answer">
        {SAFETY_ITEMS.map((item) => (
          <div key={item.title} className="gv-simple-item">
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </div>
        ))}
      </div>
    </TopicScreen>
  );
}
