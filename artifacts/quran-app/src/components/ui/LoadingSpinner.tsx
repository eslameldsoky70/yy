import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 32 }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4 p-8", className)}>
      <Loader2 
        size={size} 
        className="animate-spin text-primary" 
      />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">
        جاري التحميل...
      </p>
    </div>
  );
}
