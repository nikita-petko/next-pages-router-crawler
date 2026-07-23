import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

interface StateType {
  idempotencyKey: string;
  timestampOfGeneration: number | undefined;
}

interface ActionsType {
  setIdempotencyKey: (newKey: string) => void;
}

interface IdempotencyKeyStoreType extends StateType, ActionsType {}

export const useIdempotencyKeyStore = create<IdempotencyKeyStoreType>((set) => ({
  idempotencyKey: uuidv4(),
  setIdempotencyKey: (newKey: string) =>
    set(() => ({ idempotencyKey: newKey, timestampOfGeneration: Date.now() })),
  timestampOfGeneration: undefined,
}));
