import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Site, Page, PageComponent } from '../types';

interface AppContextType {
  user: User | null;
  currentSite: Site | null;
  currentPage: Page | null;
  sites: Site[];
  isPreviewMode: boolean;
  setUser: (user: User | null) => void;
  setCurrentSite: (site: Site | null) => void;
  setCurrentPage: (page: Page | null) => void;
  setSites: (sites: Site[]) => void;
  setPreviewMode: (isPreview: boolean) => void;
  updatePageComponents: (components: PageComponent[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'user@example.com',
    name: 'Travel Builder User',
    avatar: undefined
  });
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [isPreviewMode, setPreviewMode] = useState(false);

  const updatePageComponents = (components: PageComponent[]) => {
    if (!currentPage || !currentSite) return;

    const updatedPage = { ...currentPage, components };
    const updatedPages = currentSite.pages.map(p => 
      p.id === currentPage.id ? updatedPage : p
    );
    const updatedSite = { ...currentSite, pages: updatedPages };
    
    setCurrentPage(updatedPage);
    setCurrentSite(updatedSite);
    setSites(sites.map(s => s.id === currentSite.id ? updatedSite : s));
  };

  return (
    <AppContext.Provider value={{
      user,
      currentSite,
      currentPage,
      sites,
      isPreviewMode,
      setUser,
      setCurrentSite,
      setCurrentPage,
      setSites,
      setPreviewMode,
      updatePageComponents
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}