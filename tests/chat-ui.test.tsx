// @vitest-environment jsdom
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Widget } from '../src/components/chat/Widget';
import { SALES_FALLBACK, BUSY_MESSAGE } from '../shared/messages';

type Reply = { status?: number; body: Record<string, unknown> };
let chatCalls: { messages: { role: string; content: string }[] }[] = [];
let leadCalls: Record<string, unknown>[] = [];
let queue: Reply[] = [];
let delay = 0;
const ok = (extra: Record<string, unknown> = {}): Reply => ({ body: { reply: 'Quanta S+ goes up to 165 km on a single charge.', suggestions: ['How long does charging take?', 'What is the warranty?'], action: 'none', handoff: false, ...extra } });

beforeEach(() => {
  chatCalls = []; leadCalls = []; queue = []; delay = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}'));
    if (url === '/api/lead') { leadCalls.push(body); return new Response(JSON.stringify({ accepted: true, persisted: false, notified: false }), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
    chatCalls.push(body);
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const next = queue.shift() ?? ok();
    return new Response(JSON.stringify(next.body), { status: next.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  }));
  vi.stubGlobal('open', vi.fn(() => ({ opener: null })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openChat(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
  await user.click(container.querySelector('.gv-fab')!);
  await user.click(container.querySelector('.gv-ai-entry')!);
}
async function startChat(user: ReturnType<typeof userEvent.setup>, container: HTMLElement, mobile = '9876543210') {
  await openChat(user, container);
  await user.type(container.querySelector('input[type=tel]')!, mobile);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByLabelText('Type your question');
}
const ask = async (user: ReturnType<typeof userEvent.setup>, q: string) => { await user.type(screen.getByLabelText('Type your question'), q + '{Enter}'); };

describe('mobile number step', () => {
  it('asks for a valid number before the chat, and shows the masked number afterwards', async () => {
    const user = userEvent.setup(); const { container } = render(<Widget />); await openChat(user, container);
    await user.type(container.querySelector('input[type=tel]')!, '12345'); await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Please enter a valid 10-digit mobile number.')).toBeTruthy();
    expect(leadCalls.length).toBe(0); expect(screen.queryByLabelText('Type your question')).toBeNull();
    const input = container.querySelector('input[type=tel]') as HTMLInputElement; await user.clear(input); await user.type(input, '9876543210'); await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Type your question');
    expect(leadCalls).toHaveLength(1); expect(leadCalls[0]).toMatchObject({ mobile: '9876543210', source: 'ai-chat' });
    expect(container.querySelector('.gv-lead-context strong')!.textContent).toContain('3210');
  });
  it('keeps normal editing keys working: letters are ignored, Backspace and Delete edit digits, pasted +91 numbers are cleaned', async () => {
    const user = userEvent.setup(); const { container } = render(<Widget />); await openChat(user, container);
    const input = container.querySelector('input[type=tel]') as HTMLInputElement;
    await user.type(input, '98765x4321'); expect(input.value).toBe('987654321');
    await user.type(input, '{Backspace}{Backspace}'); expect(input.value).toBe('9876543');
    await user.type(input, '0'); expect(input.value).toBe('98765430'); await user.keyboard('{ArrowLeft}{ArrowLeft}{Delete}'); expect(input.value).toBe('9876540'); // Delete removed the digit at the cursor, mid-number
    await user.clear(input); await user.click(input); await user.paste('+91 98765 43210'); expect(input.value).toBe('9876543210');
  });
  it('lets the visitor edit the number afterwards', async () => {
    const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    const input = container.querySelector('input[type=tel]') as HTMLInputElement; expect(input.value).toBe('9876543210');
    await user.clear(input); await user.type(input, '9123456789'); await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(container.querySelector('.gv-lead-context strong')!.textContent).toContain('6789'));
  });
});

describe('asking the assistant', () => {
  it('sends only the real conversation, shows a clean answer and server-chosen follow-ups', async () => {
    const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    await ask(user, 'What is the range?');
    await screen.findByText(/165 km on a single charge/);
    expect(chatCalls).toHaveLength(1); expect(chatCalls[0].messages).toEqual([{ role: 'user', content: 'What is the range?' }]); // the greeting is never sent
    expect(container.textContent).not.toMatch(/Sources?:|\.pdf|\.docx/i);
    expect([...container.querySelectorAll('.gv-chip')].map((c) => c.textContent)).toEqual(['How long does charging take?', 'What is the warranty?']);
    await user.click(screen.getByRole('button', { name: 'What is the warranty?' }));
    await waitFor(() => expect(chatCalls).toHaveLength(2)); expect(chatCalls[1].messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  });
  it('does not send twice when Enter is pressed twice', async () => {
    delay = 60; const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    const box = screen.getByLabelText('Type your question'); await user.type(box, 'range'); await user.keyboard('{Enter}{Enter}');
    await screen.findByText(/165 km/); expect(chatCalls).toHaveLength(1);
  });
  it('shows a typing indicator and disables Send while waiting', async () => {
    delay = 120; const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    await user.type(screen.getByLabelText('Type your question'), 'range{Enter}');
    expect(await screen.findByRole('status', { name: 'Assistant is typing' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true);
    await screen.findByText(/165 km/); expect(screen.queryByRole('status', { name: 'Assistant is typing' })).toBeNull();
  });
  it('accepts spaces, punctuation, numbers and Backspace in the question box', async () => {
    const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    const box = screen.getByLabelText('Type your question') as HTMLInputElement;
    await user.type(box, 'Is it 165 km, really?'); expect(box.value).toBe('Is it 165 km, really?');
    await user.type(box, '{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'); expect(box.value).toBe('Is it 165 km, ');
  });
});

describe('hand-off to the sales team', () => {
  it('offers Talk to Sales on WhatsApp for an unanswered question, with a ready message, and sends nothing by itself', async () => {
    queue = [{ body: { reply: SALES_FALLBACK, suggestions: ['What is the range?'], action: 'whatsapp', handoff: true } }];
    const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    await ask(user, 'Do you sell helmets?'); await screen.findByText(SALES_FALLBACK);
    expect(window.open).not.toHaveBeenCalled(); // never automatic
    const button = screen.getByRole('button', { name: /Talk to Sales on WhatsApp/ }); expect(button.className).not.toContain('gv-small-wa');
    await user.click(button);
    const url = (window.open as unknown as { mock: { calls: string[][] } }).mock.calls[0][0];
    expect(url).toContain('https://wa.me/917995252220?text='); expect(decodeURIComponent(url)).toContain('Do you sell helmets?'); expect(decodeURIComponent(url)).toContain('could not answer');
  });
  it('offers the matching guided flow when the server suggests one', async () => {
    queue = [ok({ action: 'test_ride' })]; const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    await ask(user, 'Can I test ride?'); await user.click(await screen.findByRole('button', { name: 'Book a Test Ride' }));
    expect(container.querySelector('.gv-step, .gv-question')).toBeTruthy();
  });
});

describe('errors, retry, restart, navigation', () => {
  it('shows a retry for a failed answer, retries without duplicating the question, and explains a busy service plainly', async () => {
    queue = [{ status: 502, body: { code: 'AI_UPSTREAM_ERROR', error: 'x' } }, ok()];
    const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    await ask(user, 'range'); const alert = await screen.findByRole('alert'); expect(alert.textContent).toContain(SALES_FALLBACK);
    await user.click(screen.getByRole('button', { name: 'Retry' })); await screen.findByText(/165 km/);
    expect(chatCalls).toHaveLength(2); expect(container.querySelectorAll('.gv-msg-user')).toHaveLength(1);
    queue = [{ status: 429, body: { code: 'AI_QUOTA_LIMIT', error: 'x' } }]; await ask(user, 'charging');
    expect((await screen.findAllByRole('alert')).some((a) => a.textContent?.includes(BUSY_MESSAGE))).toBe(true);
  });
  it('restarts, goes back to the main menu and closes', async () => {
    const user = userEvent.setup(); const { container } = render(<Widget />); await startChat(user, container);
    await ask(user, 'range'); await screen.findByText(/165 km/);
    await user.click(screen.getByRole('button', { name: 'Restart chat' })); expect(container.querySelectorAll('.gv-msg-user')).toHaveLength(0);
    await ask(user, 'charging'); await screen.findByText(/165 km/); expect(chatCalls.at(-1)!.messages).toHaveLength(1); // a fresh conversation
    await user.click(screen.getByRole('button', { name: 'Main menu' })); expect(container.querySelector('.gv-ai-entry')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Close chat' })); expect(container.querySelector('.gv-panel')!.classList.contains('gv-open')).toBe(false);
  });
  it('keeps every existing menu action', async () => {
    const user = userEvent.setup(); const { container } = render(<Widget />); await user.click(container.querySelector('.gv-fab')!);
    for (const label of [/Book a Test Ride/i, /Become a Gravton Dealer/i, /Explore Quanta S\+/i, /Find a Showroom/i]) expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(fireEvent.click(screen.getByText(/Find a Showroom/i))).toBe(true);
  });
});
