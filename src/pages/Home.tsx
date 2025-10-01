import NavBar from '../components/NavBar';
import DigitForm from '../components/DigitForm';

export default function Home() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-2 text-2xl font-semibold">
          Reconocimiento de dígitos
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Sube una imagen de 28×28 píxeles o dibuja tu dígito. Ajusta
          correctamente <code>invert</code>.
        </p>
        <DigitForm />
      </main>
    </div>
  );
}
