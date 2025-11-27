import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BatteryWarning } from "lucide-react";

interface EnergyDepletedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnergyDepletedModal = ({ open, onOpenChange }: EnergyDepletedModalProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <BatteryWarning className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            Sua energia acabou!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Volte em alguns minutos para regenerar sua energia ou visite a Loja
            para recuperar agora mesmo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              navigate("/dashboard");
            }}
            className="w-full"
          >
            Voltar ao Menu
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/energy-shop");
            }}
            className="w-full"
          >
            Ir para a Loja
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
