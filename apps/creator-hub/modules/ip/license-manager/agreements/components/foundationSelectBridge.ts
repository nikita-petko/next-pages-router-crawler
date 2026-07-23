/** Value shape accepted by MUI `Select` and react-hook-form `Controller` field handlers. */
export type BridgedSelectChangeEvent = {
  target: { value: string };
};

export type BridgedSelectChangeHandler = (event: BridgedSelectChangeEvent) => void;

export type BridgedSelectBlurHandler = () => void;

export function toFoundationDropdownValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

export function createBridgedSelectChangeEvent(value: string): BridgedSelectChangeEvent {
  return { target: { value } };
}
