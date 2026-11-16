import logo from "@/assets/logo.png";
export function Logo({ className = "h-10" }: { className?: string }) {
  return <img src={logo} alt="Futevôlei Rankeado" className={`${className} w-auto logo-tile`} />;
}
