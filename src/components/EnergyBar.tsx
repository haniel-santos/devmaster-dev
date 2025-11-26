import { Battery, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnergyBarProps {
  currentEnergy: number;
  maxEnergy: number;
  className?: string;
}

export const EnergyBar = ({ currentEnergy, maxEnergy, className }: EnergyBarProps) => {
  const energyPercentage = (currentEnergy / maxEnergy) * 100;
  
  return (
    <div className={cn("flex items-center gap-3 bg-card rounded-xl p-3 shadow-card", className)}>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-energy-gradient flex items-center justify-center">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {currentEnergy}/{maxEnergy}
          </span>
          <span className="text-xs text-muted-foreground">Energia</span>
        </div>
      </div>
      
      <div className="flex-1 flex gap-1">
        {Array.from({ length: maxEnergy }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex-1 h-2 rounded-full transition-all duration-300",
              index < currentEnergy 
                ? "bg-energy-gradient shadow-sm" 
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
