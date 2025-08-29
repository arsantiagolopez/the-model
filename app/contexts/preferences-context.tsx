import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type PreferencesContextType = {
  oddsFormat: "decimal" | "american";
  toggleOdds: () => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export { PreferencesContext };

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

type PreferencesProviderProps = {
  children: ReactNode;
};

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  // Initialize with saved format from localStorage or default to "american"
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "american">(() => {
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem("oddsFormat") as "decimal" | "american";
      return savedFormat || "american";
    }
    return "american";
  });

  const toggleOdds = () => {
    const newFormat = oddsFormat === "american" ? "decimal" : "american";
    setOddsFormat(newFormat);
    if (typeof window !== 'undefined') {
      localStorage.setItem("oddsFormat", newFormat);
    }
  };

  const value = {
    oddsFormat,
    toggleOdds,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}