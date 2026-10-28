import { useCallback, useEffect, useRef, useState } from 'react';
import { LOGO_URL } from '../../config';
import { useChat } from '../../features/conversation/useChat';
import { useLead } from '../../features/leads/useLead';
import { listenForEmbedLayout, notifyEmbedState } from '../../services/embed';
import { dealershipFlow } from '../../features/dealership/dealershipFlow';
import { useLauncherPreview } from '../../features/launcher/useLauncherPreview';
import { showroomFlow } from '../../features/showroom/showroomFlow';
import { testRideFlow } from '../../features/test-ride/testRideFlow';
import { ChatScreen } from './ChatScreen';
import { GuidedFlow } from './GuidedFlow';
import { HomeScreen } from './HomeScreen';
import { CloseIcon } from './Icons';
import { BatteryScreen, PerformanceScreen, QuantaScreen, SafetyScreen } from './QuantaScreens';

type Screen = 'home' | 'test' | 'dealer' | 'quanta' | 'battery' | 'performance' | 'safety' | 'showroom' | 'chat';

/**
 * The Gravton chatbot: floating launcher + panel. All styling is scoped to
 * #gravton-chatbot-widget so it cannot clash with a host page.
 */
export function Widget() {
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chat = useChat();
  const lead = useLead();

  const openPanel = useCallback(() => {
    setScreen('home');
    setIsOpen(true);
  }, []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const { attention, markInteracted } = useLauncherPreview({ isOpen, open: openPanel, close: closePanel });

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [screen]);

  // When the chatbot runs inside the website's iframe (embed.js), tell the page whether the panel is open so it can resize the frame.
  useEffect(() => { notifyEmbedState(isOpen); }, [isOpen]);
  useEffect(() => listenForEmbedLayout(), []);

  const askAssistant = (question: string | null) => {
    setPendingQuestion(question);
    setScreen('chat');
  };
  const clearPendingQuestion = useCallback(() => setPendingQuestion(null), []);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={setScreen}
            onAsk={askAssistant}
          />
        );
      case 'test':
        return <GuidedFlow key="test" flow={testRideFlow} onExit={() => setScreen('home')} onAskAssistant={() => askAssistant(null)} />;
      case 'dealer':
        return <GuidedFlow key="dealer" flow={dealershipFlow} onExit={() => setScreen('home')} />;
      case 'showroom':
        return <GuidedFlow key="showroom" flow={showroomFlow} onExit={() => setScreen('home')} />;
      case 'quanta':
        return (
          <QuantaScreen
            onBack={() => setScreen('home')}
            onMainMenu={() => setScreen('home')}
            onOpenTopic={setScreen}
            onBookRide={() => setScreen('test')}
            onAskAssistant={() => askAssistant(null)}
          />
        );
      case 'battery':
        return <BatteryScreen onBack={() => setScreen('quanta')} onMainMenu={() => setScreen('home')} />;
      case 'performance':
        return <PerformanceScreen onBack={() => setScreen('quanta')} onMainMenu={() => setScreen('home')} />;
      case 'safety':
        return <SafetyScreen onBack={() => setScreen('quanta')} onMainMenu={() => setScreen('home')} />;
      case 'chat':
        return (
          <ChatScreen
            chat={chat}
            lead={lead}
            initialQuestion={pendingQuestion}
            onInitialQuestionHandled={clearPendingQuestion}
            onBack={() => setScreen('home')}
            onOpenFlow={setScreen}
          />
        );
    }
  };

  return (
    <div id="gravton-chatbot-widget">
      <div
        className={`gv-panel${isOpen ? ' gv-open' : ''}`}
        role="dialog"
        aria-label="Gravton AI Assistant"
        onClickCapture={markInteracted}
        onInput={markInteracted}
      >
        <div className="gv-head">
          <div className="gv-head-left">
            <span className="gv-logo-box">
              <img className="gv-logo" src={LOGO_URL} alt="Gravton" />
            </span>
          </div>
          <button
            type="button"
            className="gv-x"
            aria-label="Close chat"
            onClick={() => {
              markInteracted();
              closePanel();
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="gv-body" ref={bodyRef}>
          {renderScreen()}
        </div>
      </div>

      <button
        type="button"
        className={`gv-fab${attention ? ' gv-attention' : ''}`}
        aria-label="Ask Gravton AI"
        onClick={() => {
          markInteracted();
          if (isOpen) closePanel();
          else openPanel();
        }}
      >
        <img className="gv-fab-ico" src="/assets/gravton-mark.png" alt="" />
        <span className="gv-fab-txt">Ask Gravton AI</span>
      </button>
    </div>
  );
}
