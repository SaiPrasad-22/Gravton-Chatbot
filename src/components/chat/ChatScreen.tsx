import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CHAT_LIMITS, type ChatAction } from '../../shared/chatContract';
import type { LeadController } from '../../features/leads/useLead';
import { CHAT_EYEBROW, CHAT_SUBTITLE, CHAT_TITLE, HANDOFF_NOTE, INPUT_PLACEHOLDER } from '../../config/chat-copy';
import type { ChatController } from '../../features/conversation/useChat';
import { buildChatHandoffMessage, buildUnansweredMessage } from '../../services/whatsapp';
import { BackButton } from './BackButton';
import { LeadGate } from './LeadGate';
import { SendIcon } from './Icons';
import { WhatsAppAction } from './WhatsAppAction';

export type FlowTarget = 'test' | 'dealer' | 'showroom';

interface Props {
  chat: ChatController;
  lead: LeadController;
  /** A question typed on the home screen, sent once when the chat opens. */
  initialQuestion: string | null;
  onInitialQuestionHandled: () => void;
  onBack: () => void;
  onOpenFlow: (target: FlowTarget) => void;
}

interface FlowButton {
  target: FlowTarget;
  label: string;
}

/** Maps the assistant's suggested action to a menu flow, or null when the action is not a flow. */
function flowButtonFor(action: ChatAction): FlowButton | null {
  switch (action) {
    case 'test_ride':
      return { target: 'test', label: 'Book a Test Ride' };
    case 'dealer':
      return { target: 'dealer', label: 'Become a Gravton Dealer' };
    case 'showroom':
      return { target: 'showroom', label: 'Find a Showroom' };
    case 'whatsapp':
    case 'none':
      return null;
  }
}

export function ChatScreen({ chat, lead, initialQuestion, onInitialQuestionHandled, onBack, onOpenFlow }: Props) {
  const { state, send, retry, reset } = chat;
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const mobile = lead.lead?.mobile ?? '';
  const gated = !mobile || editing;
  const logRef = useRef<HTMLDivElement>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!initialQuestion || handled.current || !mobile) return;
    handled.current = true;
    send(initialQuestion);
    onInitialQuestionHandled();
  }, [initialQuestion, send, onInitialQuestionHandled, mobile]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    // A new answer opens at its first line (a long answer must not land the reader in the middle of it); everything else follows the bottom.
    const last = log.querySelector<HTMLElement>('.gv-msg:last-of-type');
    if (state.status === 'idle' && state.messages.at(-1)?.role === 'assistant' && !state.messages.at(-1)?.local && last && last.offsetHeight > log.clientHeight * 0.6) {
      log.scrollTop = last.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop - 4;
      return;
    }
    log.scrollTop = log.scrollHeight;
  }, [state.messages, state.status]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (send(draft)) setDraft('');
  };

  const loading = state.status === 'loading';
  const idle = state.status === 'idle';
  const flowButton = idle ? flowButtonFor(state.action) : null;

  return (
    <div className="gv-screen">
      <div className="gv-chat-top">
        <BackButton onClick={onBack} label="Main menu" />
        <button type="button" className="gv-link-btn" onClick={reset}>
          Restart chat
        </button>
      </div>

      <div className="gv-chat-heading">
        <span className="gv-eyebrow">{CHAT_EYEBROW}</span>
        <h3 className="gv-h3">{CHAT_TITLE}</h3>
        <p className="gv-p">{CHAT_SUBTITLE}</p>
      </div>
      {mobile && !editing && (
        <div className="gv-lead-context">
          <span className="gv-avatar">G</span>
          <span><small>YOUR DETAILS</small><strong>+91 •••••• {mobile.slice(-4)}</strong></span>
          <button type="button" className="gv-link-btn" onClick={() => setEditing(true)}>Edit details</button>
        </div>
      )}
      {gated && <LeadGate lead={lead} initialMobile={mobile} onDone={() => setEditing(false)} onCancel={mobile ? () => setEditing(false) : undefined} />}

      {!gated && (
      <div className="gv-chat">
        <div className="gv-msgs" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
          {state.messages.map((message) => (
            <div key={message.id} className={`gv-msg ${message.role === 'user' ? 'gv-msg-user' : 'gv-msg-bot'}`}>
              {message.content}
            </div>
          ))}
          {loading && (
            <div className="gv-msg gv-msg-bot gv-typing" role="status" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          )}
          {state.status === 'error' && state.error && (
            <div className="gv-chat-error" role="alert">
              <span>{state.error}</span>
              <button type="button" className="gv-link-btn" onClick={retry}>
                Retry
              </button>
            </div>
          )}
        </div>

        <div className="gv-chat-tools">
          {state.handoff ? (
            <>
              <p className="gv-p gv-p-s gv-handoff-note">{HANDOFF_NOTE}</p>
              <WhatsAppAction className="gv-wa" label="Talk to Sales on WhatsApp" message={buildUnansweredMessage(state.lastQuestion)} />
            </>
          ) : (
            <WhatsAppAction className="gv-wa gv-small-wa" label="Talk to Sales on WhatsApp" message={buildChatHandoffMessage(state.lastQuestion)} />
          )}
          {flowButton && (
            <button type="button" className="gv-secondary-btn" onClick={() => onOpenFlow(flowButton.target)}>
              {flowButton.label}
            </button>
          )}
          {idle && state.suggestions.length > 0 && (
            <div className="gv-chips">
              {state.suggestions.map((suggestion) => (
                <button key={suggestion} type="button" className="gv-chip" onClick={() => send(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="gv-composer" onSubmit={submit}>
          <input
            className="gv-input"
            type="text"
            value={draft}
            maxLength={CHAT_LIMITS.maxUserChars}
            placeholder={INPUT_PLACEHOLDER}
            aria-label="Type your question"
            enterKeyHint="send"
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="gv-send" aria-label="Send" disabled={loading || !draft.trim()}>
            <SendIcon />
          </button>
        </form>
      </div>
      )}
    </div>
  );
}