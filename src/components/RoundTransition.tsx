import { useEffect } from "react";
import pixelLogo from "@/assets/pixel_logo.png";

interface RoundTransitionProps {
  round: number;
  onComplete: () => void;
}

const RoundTransition = ({ round, onComplete }: RoundTransitionProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-fade-in">
      <div className="text-center space-y-8 animate-scale-in">
        <img 
          src={pixelLogo} 
          alt="SGDC Live Logo" 
          className="w-48 h-48 mx-auto animate-pulse"
        />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            sgdc live | The Imposter Challenge
          </h1>
          <h2 className="text-5xl font-bold text-primary">
            Ronde {round}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default RoundTransition;
