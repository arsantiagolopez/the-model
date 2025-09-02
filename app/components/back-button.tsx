import React from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function BackButton({ 
  to, 
  label = 'Back', 
  className,
  variant = 'ghost',
  size = 'default'
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      // Navigate to specific route
      navigate(to);
    } else {
      // Go back in history
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}

// Specialized back button for Apple Sports style navigation
export function AppleSportsBackButton({ 
  to, 
  label = 'Back',
  className 
}: BackButtonProps) {
  return (
    <BackButton
      to={to}
      label={label}
      variant="ghost"
      size="sm"
      className={cn(
        'px-2 py-1 h-8 rounded-full text-sm font-medium',
        'hover:bg-muted/50 active:bg-muted/70',
        'transition-all duration-150',
        className
      )}
    />
  );
}