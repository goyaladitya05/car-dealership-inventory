import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link
      to="/"
      className="text-[1.7rem] font-semibold tracking-[-0.08em] text-ink"
      aria-label="AutoVault home"
    >
      autovault
    </Link>
  );
}
