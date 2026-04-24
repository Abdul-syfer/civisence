import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  date: string;
  done: boolean;
}

const StatusTimeline = ({ steps }: { steps: Step[] }) => (
  <div className="space-y-0">
    {steps.map((step, i) => (
      <div key={i} className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs border-2",
            step.done
              ? "bg-accent border-accent text-accent-foreground"
              : "border-border bg-muted text-muted-foreground"
          )}>
            {step.done && <Check className="w-3.5 h-3.5" />}
          </div>
          {i < steps.length - 1 && (
            <div className={cn("w-0.5 h-6", step.done ? "bg-accent" : "bg-border")} />
          )}
        </div>
        <div className="pt-0.5">
          <p className={cn("text-sm font-medium", step.done ? "text-foreground" : "text-muted-foreground")}>
            {step.label}
          </p>
          {step.date && <p className="text-xs text-muted-foreground">{step.date}</p>}
        </div>
      </div>
    ))}
  </div>
);

export default StatusTimeline;
