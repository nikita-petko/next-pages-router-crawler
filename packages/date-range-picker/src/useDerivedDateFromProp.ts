import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

/**
 * Track internal display state that resets whenever the caller-supplied
 * `Date` prop changes, without using an effect (react-compiler
 * `EffectDerivationsOfState`). Callers can still mutate the display state
 * locally between prop changes via the returned setter.
 */
const useDerivedDateFromProp = (prop: Date): [Date, Dispatch<SetStateAction<Date>>] => {
  const [prev, setPrev] = useState<Date>(prop);
  const [display, setDisplay] = useState<Date>(prop);
  if (prev.getTime() !== prop.getTime()) {
    setPrev(prop);
    setDisplay(prop);
  }
  return [display, setDisplay];
};

export default useDerivedDateFromProp;
