import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ActiveContextType {
  activeBatchId: number | null;
  setActiveBatchId: (id: number | null) => void;
  activeBranchId: number | null;
  setActiveBranchId: (id: number | null) => void;
}

const ActiveContext = createContext<ActiveContextType | undefined>(undefined);

export function ActiveProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available to persist state across reloads
  const [activeBatchId, setActiveBatchIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("activeBatchId");
    return stored ? parseInt(stored) : null;
  });

  const [activeBranchId, setActiveBranchIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("activeBranchId");
    return stored ? parseInt(stored) : null;
  });

  const setActiveBatchId = (id: number | null) => {
    setActiveBatchIdState(id);
    if (id) {
      localStorage.setItem("activeBatchId", id.toString());
    } else {
      localStorage.removeItem("activeBatchId");
    }
    // When batch changes, branch might be invalid, so we should probably reset it
    // But let's leave that to the consumer or explicit action to avoid auto-clearing if not needed
  };

  const setActiveBranchId = (id: number | null) => {
    setActiveBranchIdState(id);
    if (id) {
      localStorage.setItem("activeBranchId", id.toString());
    } else {
      localStorage.removeItem("activeBranchId");
    }
  };

  return (
    <ActiveContext.Provider value={{ 
      activeBatchId, 
      setActiveBatchId, 
      activeBranchId, 
      setActiveBranchId 
    }}>
      {children}
    </ActiveContext.Provider>
  );
}

export function useActive() {
  const context = useContext(ActiveContext);
  if (context === undefined) {
    throw new Error("useActive must be used within an ActiveProvider");
  }
  return context;
}
