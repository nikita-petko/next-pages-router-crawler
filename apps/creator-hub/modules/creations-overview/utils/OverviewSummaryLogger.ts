import { UnifiedLogger } from '@rbx/unified-logger';

export enum OverviewSummaryEventName {
  EditInStudioClick = 'analytics/overviewSummary/editInStudioClick',
  ViewOnRobloxClick = 'analytics/overviewSummary/viewOnRobloxClick',
  EditDetailsClick = 'analytics/overviewSummary/viewEditDetails',
}

export type OverviewSummaryButtonLogFields = {
  universeId: number;
  placeId: number;
};

export const logViewOnRobloxClick = (
  client: UnifiedLogger,
  { universeId, placeId }: OverviewSummaryButtonLogFields,
) => {
  const eventName = OverviewSummaryEventName.ViewOnRobloxClick;
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
      place_id: `${placeId}`,
    },
  });
};

export const logEditInStudioClick = (
  client: UnifiedLogger,
  { universeId, placeId }: OverviewSummaryButtonLogFields,
) => {
  const eventName = OverviewSummaryEventName.EditInStudioClick;
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
      place_id: `${placeId}`,
    },
  });
};

export const logEditDetailsClick = (
  client: UnifiedLogger,
  { universeId, placeId }: OverviewSummaryButtonLogFields,
) => {
  const eventName = OverviewSummaryEventName.EditDetailsClick;
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
      place_id: `${placeId}`,
    },
  });
};
