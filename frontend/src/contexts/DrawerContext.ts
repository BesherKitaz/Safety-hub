// DrawerContext.ts
import { createContext } from "react";

type DrawerContextType = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DrawerContext = createContext<DrawerContextType | null>(null);

export default DrawerContext;