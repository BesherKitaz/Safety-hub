import { createContext } from 'react';

type Header = {
  title: string;
  actions: React.ReactNode;
};

type HeaderContextType = {
  header: Header;
  setHeader: React.Dispatch<React.SetStateAction<Header>>;
};

const HeaderContext = createContext<HeaderContextType | null>(null);

export default HeaderContext;