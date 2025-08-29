import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  // Use event listener directly in render instead of useEffect
  if (typeof window !== 'undefined') {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Add listener if not already added (simple way to avoid duplicates)
    if (!mql.onchange) {
      mql.addEventListener("change", onChange);
      mql.onchange = onChange; // Mark as added
    }
  }

  return !!isMobile
}
