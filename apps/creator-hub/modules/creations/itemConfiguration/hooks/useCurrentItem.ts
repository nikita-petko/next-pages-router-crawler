import { useContext } from 'react';
import itemContext from './ItemDetailsContext';

export default function useItemContext() {
  return useContext(itemContext);
}
