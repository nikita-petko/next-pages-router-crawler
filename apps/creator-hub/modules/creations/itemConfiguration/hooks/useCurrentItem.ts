import { useContext } from 'react';
import itemContext from './ItemDetailsContext';

export default function useCurrentItem() {
  return useContext(itemContext);
}
