import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { TargetType, LoggingTarget } from './LoggingTarget';

const loggingTargetToParameter = (loggingTarget?: LoggingTarget): { [key: string]: string } => {
  if (!loggingTarget) {
    return {};
  }
  switch (loggingTarget.targetType) {
    case TargetType.UniverseId:
    case RAQIV2ChartResourceType.Universe:
      return { universeId: `${loggingTarget.targetId}` };
    case TargetType.ItemId:
      return { itemId: `${loggingTarget.targetId}` };
    case RAQIV2ChartResourceType.Group:
      return { groupId: `${loggingTarget.targetId}` };
    case RAQIV2ChartResourceType.User:
      return { userId: `${loggingTarget.targetId}` };
    default: {
      const exhaustiveCheck: never = loggingTarget.targetType;
      throw new Error(`Unhandled target type ${exhaustiveCheck}`);
    }
  }
};

export default loggingTargetToParameter;
