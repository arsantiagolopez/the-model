import * as React from "react"
import { cn } from "~/lib/utils"

interface SectionHeaderProps extends React.ComponentProps<"div"> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'date' | 'tournament';
}

function SectionHeader({ 
  className,
  title,
  subtitle,
  action,
  variant = 'default',
  ...props 
}: SectionHeaderProps) {
  const formatDateTitle = (title: string) => {
    // Convert date string to Apple Sports format (e.g., "THURSDAY, MAR 7")
    try {
      const date = new Date(title);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric'
      }).toUpperCase();
    } catch {
      return title.toUpperCase();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        variant === 'date' && "mb-3 mt-6 first:mt-0",
        variant === 'tournament' && "mb-4",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <h2 
          className={cn(
            "font-semibold tracking-wide",
            variant === 'date' && "text-sm text-muted-foreground uppercase",
            variant === 'tournament' && "text-lg text-foreground",
            variant === 'default' && "text-base text-foreground"
          )}
        >
          {variant === 'date' ? formatDateTitle(title) : title}
        </h2>
        {subtitle && (
          <p className={cn(
            "text-sm text-muted-foreground mt-1",
            variant === 'date' && "text-xs"
          )}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };