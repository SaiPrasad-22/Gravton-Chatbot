import { useState } from 'react';
import { WHATSAPP_DISPLAY_NUMBER, WHATSAPP_ICON_URL } from '../../config';
import { copyText, openWhatsApp } from '../../services/whatsapp';

type Status = 'idle' | 'opened' | 'blocked' | 'copied' | 'copy_failed';

interface Props {
  message: string;
  label: string;
  className?: string;
}

export function WhatsAppAction({ message, label, className = 'gv-wa' }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const copy = async () => setStatus((await copyText(message)) ? 'copied' : 'copy_failed');

  return (
    <>
      <button type="button" className={className} onClick={() => setStatus(openWhatsApp(message) ? 'opened' : 'blocked')}>
        <img className="gv-wa-ico" src={WHATSAPP_ICON_URL} alt="" />
        {label}
      </button>
      {status !== 'idle' && (
        <div className="gv-handoff" role="status">
          {status === 'opened' && <p>WhatsApp opened with your message ready. Gravton receives it after you send it.</p>}
          {status === 'blocked' && <p>WhatsApp could not open. Copy your message and send it to {WHATSAPP_DISPLAY_NUMBER}.</p>}
          {status === 'copied' && <p>Message copied. Paste it into your WhatsApp chat with {WHATSAPP_DISPLAY_NUMBER}.</p>}
          {status === 'copy_failed' && <p>Select the message below and copy it manually.</p>}
          {(status === 'blocked' || status === 'copy_failed') && (
            <textarea className="gv-input gv-handoff-text" readOnly value={message} aria-label="Prepared WhatsApp message" />
          )}
          {(status === 'blocked' || status === 'copy_failed') && (
            <button type="button" className="gv-link-btn" onClick={() => void copy()}>Copy message</button>
          )}
        </div>
      )}
    </>
  );
}
