import type { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  appendMomentsCreationsContextParameters,
  type MomentsCreationsContext,
  MomentsCreationsOperation,
} from './momentsCreationsLoggingShared';

export { MomentsCreationsOperation, type MomentsCreationsContext };

export const buildMomentsCreationsAttemptEvent = (
  operation: MomentsCreationsOperation,
  context: MomentsCreationsContext = {},
) => ({
  eventName: CreatorDashboardEventType.MomentsCreationsAttempt,
  parameters: appendMomentsCreationsContextParameters({ operation }, context),
});

export const buildMomentsCreationsSuccessEvent = (
  operation: MomentsCreationsOperation,
  context: MomentsCreationsContext = {},
) => ({
  eventName: CreatorDashboardEventType.MomentsCreationsSuccess,
  parameters: appendMomentsCreationsContextParameters({ operation }, context),
});

export const logMomentsCreationsAttempt = (
  operation: MomentsCreationsOperation,
  context: MomentsCreationsContext = {},
  client: UnifiedLogger = unifiedLoggerClient,
): void => {
  client.logClickEvent(buildMomentsCreationsAttemptEvent(operation, context));
};

export const logMomentsCreationsSuccess = (
  operation: MomentsCreationsOperation,
  context: MomentsCreationsContext = {},
  client: UnifiedLogger = unifiedLoggerClient,
): void => {
  client.logImpressionEvent(buildMomentsCreationsSuccessEvent(operation, context));
};
