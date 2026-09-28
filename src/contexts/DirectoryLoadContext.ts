import { createContext, useContext } from 'react';
export const DirectoryLoadContext = createContext({ pending: false, error: '' });
export const useDirectoryLoad = () => useContext(DirectoryLoadContext);

export const DirectorySearchContext = createContext(false);
export const useDirectorySearchPending = () => useContext(DirectorySearchContext);
