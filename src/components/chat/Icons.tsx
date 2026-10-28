import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const round = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function ArrowIcon(props: IconProps) {
  return (
    <svg className="gv-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...round} aria-hidden="true" {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...round} aria-hidden="true" {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M18 6L6 18M6 6L18 18" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg className="gv-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...round} aria-hidden="true" {...props}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

/* Menu icons — paths copied from the original widget. The ride icon deliberately has no
   fill="none", exactly like the original markup. */
const MENU_ICON = { viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: '1.6', ...round, 'aria-hidden': true } as const;

export function RideIcon() {
  return (
    <svg {...MENU_ICON}>
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}

export function DealerIcon() {
  return (
    <svg {...MENU_ICON} fill="none">
      <path d="M3 10l2-5h14l2 5" />
      <path d="M4 10v9h16v-9" />
      <path d="M8 19v-5h8v5" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg {...MENU_ICON} fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}

export function ShowroomIcon() {
  return (
    <svg {...MENU_ICON} fill="none">
      <path d="M3 10l2-5h14l2 5" />
      <path d="M4 10v9h16v-9" />
      <path d="M9 19v-5h6v5" />
    </svg>
  );
}
