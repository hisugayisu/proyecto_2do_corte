import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();
  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded ${
        pathname === to ? 'bg-black text-white' : 'text-black hover:bg-gray-200'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-3">
        <div className="font-semibold">Reconoce Dígitos</div>
        <div className="space-x-2">
          {link('/', 'Inicio')}
          {link('/history', 'Historial')}
        </div>
      </nav>
    </header>
  );
}
