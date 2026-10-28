import { BackIcon } from './Icons';

interface Props {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = 'Back' }: Props) {
  return (
    <button type="button" className="gv-back" onClick={onClick}>
      <BackIcon />
      {label}
    </button>
  );
}
