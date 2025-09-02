import * as React from "react"
import { Link, useLocation } from "react-router"
import { cn } from "~/lib/utils"

interface SegmentedNavItem {
  label: string;
  value: string;
  href: string;
}

interface SegmentedNavProps extends React.ComponentProps<"div"> {
  items: SegmentedNavItem[];
  variant?: 'default' | 'pills';
}

function SegmentedNav({ 
  className,
  items,
  variant = 'default',
  ...props 
}: SegmentedNavProps) {
  const location = useLocation();
  
  return (
    <div
      className={cn(
        // Apple Sports segmented control styling
        "inline-flex items-center justify-center rounded-xl bg-muted p-1",
        "h-10",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.value}
            to={item.href}
            className={cn(
              // Base styling for all segments
              "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2",
              "text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              // Active state (matches Apple Sports selected segment)
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export { SegmentedNav };
export type { SegmentedNavProps, SegmentedNavItem };