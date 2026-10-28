import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { FlowDefinition, FlowStep } from '../../features/flows/types';
import { todayISO } from '../../features/flows/validation';
import { BackButton } from './BackButton';
import { ChevronIcon } from './Icons';
import { WhatsAppAction } from './WhatsAppAction';

interface Props<K extends string> {
  flow: FlowDefinition<K>;
  /** Called when the visitor goes back from the first step. */
  onExit: () => void;
  onAskAssistant?: () => void;
}

function showValue<K extends string>(step: FlowStep<K>, value: string): string {
  if (!value.trim()) return 'Not provided';
  return step.display ? step.display(value) : value.trim();
}

/**
 * One-question-at-a-time flow shared by test ride, dealership and showroom enquiries.
 * Answers are kept when going back; the review screen lets the visitor check and edit them
 * before opening WhatsApp.
 */
export function GuidedFlow<K extends string>({ flow, onExit, onAskAssistant }: Props<K>) {
  const total = flow.steps.length;
  const fieldId = useId();
  const fieldRef = useRef<HTMLElement | null>(null);
  const [values, setValues] = useState(flow.initialValues);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingFromReview, setEditingFromReview] = useState(false);

  const reviewing = index >= total;
  const step = reviewing ? undefined : flow.steps[index];

  useEffect(() => {
    fieldRef.current?.focus();
  }, [index]);

  const setValue = (key: K, raw: string, sanitize?: (value: string) => string) => {
    setValues((prev) => ({ ...prev, [key]: sanitize ? sanitize(raw) : raw }));
    setError(null);
  };

  const goBack = () => {
    setError(null);
    if (reviewing) return setIndex(total - 1);
    if (editingFromReview) {
      setEditingFromReview(false);
      return setIndex(total);
    }
    if (index === 0) return onExit();
    setIndex(index - 1);
  };

  const goNext = (event: FormEvent) => {
    event.preventDefault();
    if (!step) return;
    const message = step.validate(values[step.key]);
    if (message) return setError(message);
    setError(null);
    if (editingFromReview) {
      setEditingFromReview(false);
      return setIndex(total);
    }
    setIndex(index + 1);
  };

  const editStep = (position: number) => {
    setError(null);
    setEditingFromReview(true);
    setIndex(position);
  };

  const header = (
    <>
      <div className="gv-chat-top gv-flow-nav">
        <BackButton onClick={goBack} />
        <button type="button" className="gv-link-btn" onClick={onExit}>Main menu</button>
      </div>
      <div className="gv-titles">
        <h3 className="gv-h3 gv-h3b">{flow.title}</h3>
        <p className="gv-p gv-p-s">{flow.subtitle}</p>
      </div>
    </>
  );

  if (reviewing || !step) {
    const firstInvalid = flow.steps.findIndex((s) => s.validate(values[s.key]) !== null);
    return (
      <div className="gv-screen">
        {header}
        <p className="gv-question">Review your details</p>
        <div className="gv-answer">
          {flow.steps.map((s, position) => (
            <button key={s.key} type="button" className="gv-answer-row gv-row-btn" onClick={() => editStep(position)}>
              <span>{s.label}</span>
              <b>{showValue(s, values[s.key])}</b>
            </button>
          ))}
        </div>
        {firstInvalid >= 0 ? (
          <>
            <p className="gv-err" role="alert">
              Please check “{flow.steps[firstInvalid]?.label}” before continuing.
            </p>
            <button type="button" className="gv-secondary-btn" onClick={() => editStep(firstInvalid)}>
              Fix details
            </button>
          </>
        ) : (
          <>
            <p className="gv-p gv-review-note">
              Tap a row to change it. Continuing opens WhatsApp with this message ready; Gravton receives your enquiry only
              after you send it there.
            </p>
            <WhatsAppAction message={flow.buildMessage(values)} label="Continue on WhatsApp" />
          </>
        )}
      </div>
    );
  }

  const value = values[step.key];
  const nextLabel = step.optional && !value.trim() ? 'Skip' : step.kind === 'yesno' ? 'Continue' : index === total - 1 || editingFromReview ? 'Review' : 'Next';

  return (
    <div className="gv-screen">
      {header}
      <form onSubmit={goNext} noValidate>
        <p className="gv-step">
          Step {index + 1} of {total}
        </p>
        <p className="gv-question">{step.question}</p>
        <div className="gv-field gv-field-last">
          <label className="gv-label" htmlFor={fieldId}>
            {step.label}
          </label>
          {step.kind === 'select' && (
            <div className="gv-selwrap">
              <select
                id={fieldId}
                ref={(el) => {
                  fieldRef.current = el;
                }}
                className="gv-input gv-select"
                value={value}
                onChange={(e) => setValue(step.key, e.target.value)}
              >
                {step.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          )}
          {step.kind === 'yesno' && (
            <div className="gv-options" role="group" aria-label={step.label}>
              {step.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`gv-option${value === option.value ? ' gv-active' : ''}`}
                  aria-pressed={value === option.value}
                  onClick={() => setValue(step.key, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {(step.kind === 'text' || step.kind === 'tel' || step.kind === 'date') && (
            <input
              id={fieldId}
              ref={(el) => {
                fieldRef.current = el;
              }}
              className="gv-input"
              type={step.kind}
              value={value}
              placeholder={step.placeholder}
              min={step.kind === 'date' ? todayISO() : undefined}
              inputMode={step.kind === 'tel' ? 'numeric' : undefined}
              autoComplete={step.kind === 'tel' ? 'tel-national' : undefined}
              onChange={(e) => setValue(step.key, e.target.value, step.sanitize)}
            />
          )}
        </div>
        {error && (
          <p className="gv-err" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="gv-next">
          {nextLabel}
        </button>
        {flow.id === 'test' && index === 0 && onAskAssistant && (
          <button type="button" className="gv-ai-question-btn" onClick={onAskAssistant}>
            <img src="/assets/gravton-mark.png" alt="" />
            Ask Gravton AI · Type your question
          </button>
        )}
      </form>
    </div>
  );
}
