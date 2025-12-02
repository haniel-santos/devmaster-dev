import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export const StreakDisplay = ({ currentStreak, longestStreak, className }: StreakDisplayProps) => {
  const isStreakActive = currentStreak > 0;

  return (
    <div className={cn("flex items-center gap-3 bg-card rounded-xl p-3 shadow-card", className)}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isStreakActive ? "bg-energy-gradient" : "bg-muted"
        )}>
          <Flame 
            className={cn(
              "w-5 h-5",
              isStreakActive ? "text-white fill-white" : "text-muted-foreground"
            )}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
          </span>
          <span className="text-xs text-muted-foreground">Streak</span>
        </div>
      </div>
    </div>
  );
};
