import { Flame } from "lucide-react";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakDisplay = ({ currentStreak, longestStreak }: StreakDisplayProps) => {
  const isStreakActive = currentStreak > 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
      <div className={`relative ${isStreakActive ? 'animate-pulse' : ''}`}>
        <Flame 
          className={`h-8 w-8 ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`} 
          fill={isStreakActive ? "currentColor" : "none"}
        />
        {currentStreak >= 7 && (
          <span className="absolute -top-1 -right-1 text-xs">🔥</span>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {currentStreak}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentStreak === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Recorde: {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}
        </span>
      </div>
    </div>
  );
};
