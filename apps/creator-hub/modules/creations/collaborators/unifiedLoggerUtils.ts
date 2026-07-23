import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';

// Unified Logger events.  Makes the component files a little bit easier to read by reducing the lines needed to
// log

export const pageLoadEvent = (
  universeId: number,
  isOwner: boolean,
  isAgeVerified: boolean,
  isTrustedConnectionsRequired: boolean,
) => {
  return {
    eventName: CreatorDashboardEventType.SafetyCollaboratorsImpression,
    parameters: {
      view: isOwner ? 'owner' : 'nonOwner',
      isAgeVerified: String(isAgeVerified),
      isTrustedConnectionsRequired: String(isTrustedConnectionsRequired),
      isImpacted: String(isTrustedConnectionsRequired),
      universeId: universeId.toString(),
    },
  };
};

export const viewCollaboratorEvent = (universeId: number, isOwner: boolean, userId: number) => {
  return {
    eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
    parameters: {
      view: isOwner ? 'owner' : 'nonOwner',
      action: 'viewCollaboratorProfile',
      collaboratorUserId: userId.toString(),
      universeId: universeId.toString(),
    },
  };
};

export const pageSizeEvent = (
  universeId: number,
  isOwner: boolean,
  tab: string,
  newPageSize: number,
) => {
  return {
    eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
    parameters: {
      view: isOwner ? 'owner' : 'nonOwner',
      action: 'paginate',
      direction: 'pageSize',
      pageSize: newPageSize.toString(),
      universeId: universeId.toString(),
      tab,
    },
  };
};

export const pageChangeEvent = (
  universeId: number,
  isOwner: boolean,
  tab: string,
  pageSize: number,
  isForward: boolean,
) => {
  return {
    eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
    parameters: {
      view: isOwner ? 'owner' : 'nonOwner',
      action: 'paginate',
      direction: isForward ? 'next' : 'previous',
      pageSize: pageSize.toString(),
      universeId: universeId.toString(),
      tab,
    },
  };
};

export const tabSelectEvent = (universeId: number, isOwner: boolean, tab: string) => {
  return {
    eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
    parameters: {
      view: isOwner ? 'owner' : 'nonOwner',
      action: 'selectTab',
      tab,
      universeId: universeId.toString(),
    },
  };
};

export const expandTrustPillsEvent = (universeId: number, isOwner: boolean) => {
  return {
    eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
    parameters: {
      view: isOwner ? 'owner' : 'nonOwner',
      action: 'expandTrustPills',
      universeId: universeId.toString(),
    },
  };
};

export const fetchFailureEvent = (universeId: number, isOwner: boolean, error: string) => {
  return {
    eventName: CreatorDashboardEventType.SafetyCollaboratorsError,
    parameters: {
      view: isOwner ? 'owner' : 'nonOwner',
      universeId: universeId.toString(),
      reason: error,
    },
  };
};
