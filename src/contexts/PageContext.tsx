import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  show3DBackground: boolean;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const usePage = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
};

interface PageProviderProps {
  children: ReactNode;
}

export const PageProvider: React.FC<PageProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('landing');

  const show3DBackground = currentPage === 'landing';

  return (
    <PageContext.Provider value={{ currentPage, setCurrentPage, show3DBackground }}>
      {children}
    </PageContext.Provider>
  );
};
