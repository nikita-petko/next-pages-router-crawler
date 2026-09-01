import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { RecommendedEventType } from '@modules/clients/analytics';

type TUseLiveEventsDialogContext = {
  defaultEventType: RecommendedEventType;
};

export const LiveEventsDialogContext = React.createContext<TUseLiveEventsDialogContext | null>(
  null,
);

export const useLiveEventsDialog = (): TUseLiveEventsDialogContext => {
  const context = React.useContext(LiveEventsDialogContext);
  if (context === null) {
    throw new Error('useLiveEventsDialog must be used within a LiveEventsDialogProvider');
  }
  return context;
};

const LiveEventsDialogProvider: FC<
  React.PropsWithChildren<{ defaultEventType: RecommendedEventType }>
> = ({ children, defaultEventType }) => {
  const bundle = useMemo(
    () => ({
      defaultEventType,
    }),
    [defaultEventType],
  );

  return (
    <LiveEventsDialogContext.Provider value={bundle}>{children}</LiveEventsDialogContext.Provider>
  );
};

export default LiveEventsDialogProvider;
