import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { TUser } from './types';

type AuthStoreState = {
  user: TUser | null;
};

type AuthStoreActions = {
  setUser: (user: AuthStoreState['user']) => void;
};

type AuthStore = AuthStoreState & AuthStoreActions;
export type AuthStoreApi = StoreApi<AuthStore>;

export function initializeAuthStore() {
  const store = createStore<AuthStore>()((set) => ({
    user: null,
    setUser: (user: TUser | null) => set({ user }),
  }));

  return store;
}

export function useAuthStore(store: AuthStoreApi) {
  const user = useStore(store, (state) => state.user);
  const setUser = useStore(store, (state) => state.setUser);

  return { user, setUser };
}
