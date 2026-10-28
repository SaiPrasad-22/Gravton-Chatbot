import type { SelectOption } from '../../data/quanta';
import type { Validator } from './validation';

export type FieldKind = 'text' | 'tel' | 'date' | 'select' | 'yesno';

export interface FlowStep<K extends string> {
  key: K;
  /** Field label shown above the input (original label). */
  label: string;
  /** Conversational prompt shown for this single step. */
  question: string;
  kind: FieldKind;
  placeholder?: string;
  options?: readonly SelectOption[];
  /** Optional fields may be left empty (original optional-field behaviour). */
  optional?: boolean;
  validate: Validator;
  /** Applied on every change (e.g. digits only). */
  sanitize?: (value: string) => string;
  /** How the answer is shown on the review screen. */
  display?: (value: string) => string;
}

export type FlowValues<K extends string> = Record<K, string>;

export interface FlowDefinition<K extends string> {
  id: 'test' | 'dealer' | 'showroom';
  title: string;
  subtitle: string;
  steps: readonly FlowStep<K>[];
  initialValues: FlowValues<K>;
  buildMessage(values: FlowValues<K>): string;
}
