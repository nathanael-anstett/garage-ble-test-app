import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SideMenuContextType {
  isMenuVisible: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

interface SideMenuProviderProps {
  children: ReactNode;
}

export const SideMenuProvider: React.FC<SideMenuProviderProps> = ({ children }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const openMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);
  const toggleMenu = () => setIsMenuVisible(!isMenuVisible);

  const value: SideMenuContextType = {
    isMenuVisible,
    openMenu,
    closeMenu,
    toggleMenu,
  };

  return (
    <SideMenuContext.Provider value={value}>
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSideMenu = (): SideMenuContextType => {
  const context = useContext(SideMenuContext);
  if (context === undefined) {
    throw new Error('useSideMenu must be used within a SideMenuProvider');
  }
  return context;
};
