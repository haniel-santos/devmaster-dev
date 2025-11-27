import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification = ({
  achievement,
  onClose,
}: AchievementNotificationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Card className="p-4 bg-success/10 border-success shadow-lg min-w-[300px]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center animate-scale-in">
            <Trophy className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-success mb-1">
              Conquista Desbloqueada!
            </p>
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <span>{achievement.icon}</span>
              {achievement.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {achievement.description}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
