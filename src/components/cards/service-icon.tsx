import { Camera, Globe, Image, Megaphone, Palette, Rocket, Sliders, Sparkles, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { camera: Camera, globe: Globe, image: Image, megaphone: Megaphone, palette: Palette, rocket: Rocket, sliders: Sliders, sparkles: Sparkles };
export const serviceIconNames = Object.keys(icons);

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
