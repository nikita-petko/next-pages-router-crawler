import { useContext } from 'react';
import NavigationSearchContext from '../components/NavigationSearchContext';

export default function useNavigationSearch() {
  return useContext(NavigationSearchContext);
}
