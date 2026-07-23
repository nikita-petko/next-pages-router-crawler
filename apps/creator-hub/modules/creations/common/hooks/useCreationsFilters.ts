import { useContext } from 'react';
import CreationsFiltersContext from '../contexts/CreationsFiltersContext';

const useCreationsFilters = () => useContext(CreationsFiltersContext);
export default useCreationsFilters;
