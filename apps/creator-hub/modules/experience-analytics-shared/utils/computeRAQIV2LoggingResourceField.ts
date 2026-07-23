import { ChartResourceType } from '@modules/charts-generic';
import { ChartResource } from '../types/ChartResourceContextType';

const computeRAQIV2LoggingResourceField = ({ type, id }: ChartResource): Record<string, string> => {
  switch (type) {
    case ChartResourceType.User:
      return { user_id: `${id}` };
    case ChartResourceType.Group:
      return { group_id: `${id}` };
    case ChartResourceType.Universe:
      return { universe_id: `${id}` };
    default: {
      const exhaustiveCheck: never = type;
      return { [`${exhaustiveCheck}_id`]: `${id}` };
    }
  }
};
export default computeRAQIV2LoggingResourceField;
