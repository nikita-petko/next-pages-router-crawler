import { useContext } from 'react';
import ActivityFeedServiceContext from './ActivityFeedServiceContext';

const useActivityFeedService = () => {
  return useContext(ActivityFeedServiceContext);
};

export default useActivityFeedService;
