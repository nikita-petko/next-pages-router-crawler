import { create } from 'zustand';

type AdAccountAutoCreateModalGateStatus = 'dismissed' | 'pending' | 'showing' | 'willNotShow';

type AdAccountAutoCreateModalGateState = {
  setStatus: (status: AdAccountAutoCreateModalGateStatus) => void;
  status: AdAccountAutoCreateModalGateStatus;
};

const INITIAL_STATUS: AdAccountAutoCreateModalGateStatus = 'pending';

const useAdAccountAutoCreateModalGate = create<AdAccountAutoCreateModalGateState>((set, get) => ({
  setStatus: (status) => {
    if (get().status !== status) {
      set({ status });
    }
  },
  status: INITIAL_STATUS,
}));

export const resetAdAccountAutoCreateModalGate = (): void => {
  useAdAccountAutoCreateModalGate.setState({ status: INITIAL_STATUS });
};

export default useAdAccountAutoCreateModalGate;
