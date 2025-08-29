import React from "react";

export function useIsMounted() {
  const [isMounted, setIsMounted] = React.useState(() => {
    // Initialize as mounted immediately to avoid hydration mismatches
    return typeof window !== 'undefined';
  });
  
  // Set mounted to true after first render if not already
  if (!isMounted && typeof window !== 'undefined') {
    setIsMounted(true);
  }
  
  return isMounted;
}
