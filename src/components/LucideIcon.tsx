import * as Icons from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className, size = 18 }: LucideIconProps) {
  // Retrieve the component or fallback to standard Package icon
  const IconComponent = (Icons as any)[name] || Icons.Package;
  return <IconComponent className={className} size={size} />;
}
