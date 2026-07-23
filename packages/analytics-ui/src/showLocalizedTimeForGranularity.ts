import { XAxisGranularity } from './types/BaseChart';

const showLocalizedTime = (axisGranularity: XAxisGranularity): boolean => {
  switch (axisGranularity) {
    case XAxisGranularity.Minute:
      return true;
    case XAxisGranularity.Day:
    case XAxisGranularity.Month:
      return false;
    default: {
      const exhaustiveCheck: never = axisGranularity;
      throw new Error(`Unhandled axis granularity: ${exhaustiveCheck}`);
    }
  }
};

export default showLocalizedTime;
