import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  distance: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(45 93% 58%)",
  "hsl(280 70% 60%)",
  "hsl(var(--info))",
];

interface SparkleButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  type?: "button" | "submit";
}

const SparkleButton = ({
  children,
  onClick,
  className,
  disabled,
  ...rest
}: SparkleButtonProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPressed, setIsPressed] = useState(false);

  const spawnParticles = useCallback(() => {
    const count = 10 + Math.floor(Math.random() * 6);
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 0,
      y: 0,
      size: 3 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: (360 / count) * i + (Math.random() - 0.5) * 30,
      distance: 30 + Math.random() * 40,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsPressed(true);
    spawnParticles();
    setTimeout(() => setIsPressed(false), 200);
    onClick?.(e);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-visible",
        className
      )}
      whileTap={{ scale: 0.93 }}
      animate={isPressed ? { scale: [1, 1.06, 1] } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {children}

      {/* Particle container */}
      <AnimatePresence>
        {particles.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
            {particles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.distance;
              const ty = Math.sin(rad) * p.distance;
              return (
                <motion.span
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: tx,
                    y: ty,
                    opacity: 0,
                    scale: 0.2,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 + Math.random() * 0.3, ease: "easeOut" }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default SparkleButton;
