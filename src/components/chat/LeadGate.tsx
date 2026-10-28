import { useId, useRef, useState, type FormEvent } from 'react';
import { validMobile } from '../../../shared/lead';
import type { LeadController } from '../../features/leads/useLead';
import { GATE_HINT, GATE_QUESTION } from '../../config/chat-copy';
import { MobileInput } from './MobileInput';

interface Props { lead: LeadController; initialMobile?: string; onDone: () => void; onCancel?: () => void }

/** Asks for the visitor's mobile number before the AI chat, and again when they choose "Edit details". Uses the guided-flow styles. */
export function LeadGate({ lead, initialMobile = '', onDone, onCancel }: Props) {
  const id = useId();
  const [value, setValue] = useState(initialMobile);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending.current) return;
    if (!validMobile(value)) return setError('Please enter a valid 10-digit mobile number.');
    sending.current = true;
    try {
      await lead.capture({ mobile: value }, 'ai-chat');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not confirm your details. Please retry.');
    } finally {
      sending.current = false;
    }
  };

  return (
    <form className="gv-step" onSubmit={submit} noValidate>
      <p className="gv-question">{GATE_QUESTION}</p>
      <div className="gv-field gv-field-last">
        <label className="gv-label" htmlFor={id}>Mobile number</label>
        <MobileInput id={id} value={value} onChange={(v) => { setValue(v); setError(null); }} invalid={!!error} disabled={lead.busy} describedBy={error ? id + '-err' : undefined} />
        {error && <p className="gv-err" id={id + '-err'} role="alert">{error}</p>}
      </div>
      <p className="gv-note">{GATE_HINT}</p>
      <div className="gv-flow-nav">
        {onCancel && <button type="button" className="gv-link-btn" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="gv-next" disabled={lead.busy}>Continue</button>
      </div>
    </form>
  );
}
