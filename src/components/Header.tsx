import logo from '@/assets/logo.png';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 pt-5 pb-3 flex justify-center">
      <img src={logo} alt="MyTracker" className="h-[120px] w-[300px] object-contain" />
    </header>
  );
}
