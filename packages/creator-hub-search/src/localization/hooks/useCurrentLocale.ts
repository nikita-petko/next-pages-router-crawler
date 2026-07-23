import { useContext } from 'react';
import CurrentLocaleContext from '../interfaces/CurrentLocaleContext';

export default function useCurrentLocale() {
  return useContext(CurrentLocaleContext);
}
