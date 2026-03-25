import logo from '@/assets/logo.png';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
      <img src={logo} alt="MyTracker" className="h-8 object-contain" />
    </header>
  );
}
