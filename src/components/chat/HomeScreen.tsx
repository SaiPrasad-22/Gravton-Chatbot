import { type ReactNode } from 'react';
import { DIRECT_CHAT_MESSAGE } from '../../services/whatsapp';
import { ArrowIcon, BoltIcon, DealerIcon, RideIcon, ShowroomIcon } from './Icons';
import { WhatsAppAction } from './WhatsAppAction';

export type HomeTarget = 'test' | 'dealer' | 'quanta' | 'showroom';

interface MenuItem {
  target: HomeTarget;
  title: string;
  subtitle: string;
  icon: ReactNode;
  highlight?: boolean;
}

/** The five original menu choices, in their original order (the fifth is the WhatsApp button below). */
const MENU: readonly MenuItem[] = [
  { target: 'test', title: 'Book a Test Ride', subtitle: 'Experience Quanta S+', icon: <RideIcon /> },
  { target: 'dealer', title: 'Become a Gravton Dealer', subtitle: 'Explore the dealership opportunity', icon: <DealerIcon /> },
  { target: 'quanta', title: 'Explore Quanta S+', subtitle: 'Range, performance, battery & more', icon: <BoltIcon />, highlight: true },
  { target: 'showroom', title: 'Find a Showroom', subtitle: 'Find your nearest Gravton showroom', icon: <ShowroomIcon /> },
];

interface Props {
  onNavigate: (target: HomeTarget) => void;
  onAsk: (question: string) => void;
}

export function HomeScreen({ onNavigate, onAsk }: Props) {
  return (
    <div className="gv-screen">
      <div className="gv-titles">
        <span className="gv-eyebrow">GRAVTON AI ASSISTANT</span>
        <h3 className="gv-h3">How can we help?</h3>
        <p className="gv-p">Choose a quick action or ask Gravton AI.</p>
      </div>
      {MENU.map((item) => (
        <button
          key={item.target}
          type="button"
          className={`gv-card${item.highlight ? ' gv-card-highlight' : ''}`}
          onClick={() => onNavigate(item.target)}
        >
          <span className="gv-card-ico">{item.icon}</span>
          <span className="gv-card-txt">
            <strong>{item.title}</strong>
            <span>{item.subtitle}</span>
          </span>
          <ArrowIcon />
        </button>
      ))}
      <button type="button" className="gv-ai-entry" onClick={() => onAsk('')}>
        <span className="gv-ai-symbol"><img src="/assets/gravton-mark.png" alt="" /></span>
        <span className="gv-ai-entry-copy"><strong>Ask Gravton AI</strong><small>Explore Quanta with your Gravton assistant.</small></span>
        <ArrowIcon />
      </button>
      <WhatsAppAction className="gv-wa gv-home-wa" label="Chat on WhatsApp" message={DIRECT_CHAT_MESSAGE} />
      <p className="gv-note">Connect directly with the Gravton sales team</p>
    </div>
  );
}
