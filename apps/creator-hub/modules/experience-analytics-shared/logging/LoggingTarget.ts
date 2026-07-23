import type { RAQIV2ChartResourceType } from '@modules/clients/analytics';

export enum TargetType {
  UniverseId = 'UniverseId',
  ItemId = 'ItemId',
}

export type LoggingTarget = {
  targetId: number;
  targetType: TargetType | RAQIV2ChartResourceType;
};
