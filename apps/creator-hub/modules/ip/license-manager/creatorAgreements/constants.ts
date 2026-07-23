import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { AgreementFilterKeys } from '../agreements/utils/constants';
import { EXPLORE_LICENSES_HREF } from '../urls';
import { LicenseManagerImpressionEvent } from '../utils/logger';

export enum AgreementDetailsTabs {
  Details = 'Details',
  Activity = 'Activity',
}

export interface EmptyStateKeys {
  headingKey: string;
  descriptionKey: string;
  button:
    | {
        href: string;
        key: string;
      }
    | undefined;
}

export interface TabProperties {
  keyName: AgreementFilterKeys;
  labelKey: string;
  breadcrumbKey: string;
  statusEnums: AgreementStatus[];
  emptyTableImpressionEvent: LicenseManagerImpressionEvent;
  translationKeys: EmptyStateKeys;
}

export const creatorAgreementTabsConfig: TabProperties[] = [
  {
    keyName: AgreementFilterKeys.Offers,
    labelKey: 'Label.OffersWithCount',
    breadcrumbKey: 'Label.Offers',
    statusEnums: [
      AgreementStatus.Pending,
      AgreementStatus.Disputed,
      AgreementStatus.ConditionalOffer,
    ],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoOffersYet',
      descriptionKey: 'Description.NoOffersYetCreator',
      button: undefined,
    },
  },
  {
    keyName: AgreementFilterKeys.Requests,
    labelKey: 'Label.MyRequestsWithCount',
    breadcrumbKey: 'Label.MyRequests',
    statusEnums: [AgreementStatus.Inquired, AgreementStatus.Accepted],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoRequestsYet',
      descriptionKey: 'Description.NoRequestsYetCreator',
      button: {
        href: EXPLORE_LICENSES_HREF,
        key: 'Button.ExploreLicenses',
      },
    },
  },
  {
    keyName: AgreementFilterKeys.Active,
    labelKey: 'Label.ActiveWithCount',
    breadcrumbKey: 'Label.Active',
    statusEnums: [AgreementStatus.Active],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoActiveAgreementsYetCreator',
      descriptionKey: 'Description.NoActiveAgreementsYetCreator',
      button: undefined,
    },
  },
  {
    keyName: AgreementFilterKeys.Inactive,
    labelKey: 'Label.InactiveWithCount',
    breadcrumbKey: 'Label.Inactive',
    statusEnums: [
      AgreementStatus.Archived,
      AgreementStatus.Terminated,
      AgreementStatus.Unsuccessful,
      AgreementStatus.Cancelled,
      AgreementStatus.Expired,
    ],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoInactiveAgreementsYetCreator',
      descriptionKey: 'Description.NoInactiveAgreementsYetCreator',
      button: undefined,
    },
  },
];

export const getCreatorAgreementEnumsForFilter = (
  keyName: AgreementFilterKeys,
): AgreementStatus[] => {
  const filter = creatorAgreementTabsConfig.find((config) => config.keyName === keyName);
  return filter?.statusEnums ?? [];
};
