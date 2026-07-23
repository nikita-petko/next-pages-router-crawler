import {
  ASSET_ACCESS_PRIVACY,
  DISTRIBUTE_MODELS,
} from '@modules/miscellaneous/common/constants/linkConstants';
import { AssetDependencyFilter } from '@modules/react-query/assetPermissions';
import { DistributionErrorState } from '../../common';
import { OptionalDependencyAttribute } from './tableConstants';

export enum DependenciesAlertType {
  DistributingAssetExceedingDependenciesLimit,
  DistributingAssetWithIneligibleDependencies,
  DistributingAssetWithBrokenDependencies,
  MakingDecalOpenUse,
  SellingPaidModel,
  Sharing,
}

export const DistributionErrorStateToDependenciesAlertType: Partial<
  Record<DistributionErrorState, DependenciesAlertType>
> = {
  [DistributionErrorState.CompositeAssetBrokenDependencies]:
    DependenciesAlertType.DistributingAssetWithBrokenDependencies,
  [DistributionErrorState.CompositeAssetIneligibleDependencies]:
    DependenciesAlertType.DistributingAssetWithIneligibleDependencies,
  [DistributionErrorState.CompositeAssetDependenciesLimit]:
    DependenciesAlertType.DistributingAssetExceedingDependenciesLimit,
};

type AlertTypeConstants = {
  alertTitleTranslationKey: string;
  alertSubtitleTranslationKey: string;
  alertLearnMoreLink: string;
  dependenciesDescriptionTranslationKey: string | null;
  dependenciesFilter: AssetDependencyFilter;
  dependenciesTableOptionalAttributesToShow: Set<OptionalDependencyAttribute> | null;
  displayDependenciesInNewModal: boolean;
  modalTitleTranslationKey: string | null;
  // Whether to fetch and display individual dependencies at all. When false,
  // only the alert banner is shown (e.g. broken dependencies where the user
  // must reupload the model rather than act on individual assets).
  shouldShowDependencies: boolean;
  // When dependencies are fetched, the creator type and ID will always be
  // included. This allows us to filter based on the creator. Regardless, we
  // should only need to include the creator name if we are displaying
  // dependencies created by other creators. This boolean controls whether we
  // attempt to fetch the creator names.
  shouldFetchCreatorNameForDependencies: boolean;
};

export const alertTypeConstants: Record<DependenciesAlertType, AlertTypeConstants> = {
  [DependenciesAlertType.DistributingAssetExceedingDependenciesLimit]: {
    alertTitleTranslationKey: 'Heading.DependenciesAlertTitleDistribution',
    alertSubtitleTranslationKey: 'Description.DependenciesExceedLimit',
    alertLearnMoreLink: DISTRIBUTE_MODELS,
    dependenciesDescriptionTranslationKey: null,
    dependenciesFilter: AssetDependencyFilter.CannotBeDistributedViaComposite,
    dependenciesTableOptionalAttributesToShow: new Set([
      OptionalDependencyAttribute.AssetType,
      OptionalDependencyAttribute.Creator,
    ]),
    displayDependenciesInNewModal: false,
    modalTitleTranslationKey: null,
    shouldShowDependencies: true,
    shouldFetchCreatorNameForDependencies: false,
  },
  [DependenciesAlertType.DistributingAssetWithIneligibleDependencies]: {
    alertTitleTranslationKey: 'Heading.DependenciesAlertTitleDistribution',
    alertSubtitleTranslationKey: 'Description.DependenciesAreIneligible',
    alertLearnMoreLink: DISTRIBUTE_MODELS,
    dependenciesDescriptionTranslationKey: 'Description.DependenciesDescriptionDistribution',
    dependenciesFilter: AssetDependencyFilter.CannotBeDistributedViaComposite,
    dependenciesTableOptionalAttributesToShow: new Set([
      OptionalDependencyAttribute.AssetType,
      OptionalDependencyAttribute.Creator,
    ]),
    displayDependenciesInNewModal: true,
    modalTitleTranslationKey: 'Label.UnsupportedAssets',
    shouldShowDependencies: true,
    shouldFetchCreatorNameForDependencies: true,
  },
  [DependenciesAlertType.DistributingAssetWithBrokenDependencies]: {
    alertTitleTranslationKey: 'Heading.DependenciesAlertTitleDistribution',
    alertSubtitleTranslationKey: 'Description.DependenciesAreBroken',
    alertLearnMoreLink: DISTRIBUTE_MODELS,
    dependenciesDescriptionTranslationKey: null,
    dependenciesFilter: AssetDependencyFilter.CannotBeDistributedViaComposite,
    dependenciesTableOptionalAttributesToShow: null,
    displayDependenciesInNewModal: false,
    modalTitleTranslationKey: null,
    shouldShowDependencies: false,
    shouldFetchCreatorNameForDependencies: false,
  },
  [DependenciesAlertType.Sharing]: {
    alertTitleTranslationKey: 'Heading.DependenciesAlertTitleDistributionAndSharing',
    alertSubtitleTranslationKey: 'Description.DependenciesAlertSubtitleSharing',
    alertLearnMoreLink: ASSET_ACCESS_PRIVACY,
    dependenciesDescriptionTranslationKey: 'Description.DependenciesDescriptionSharing',
    dependenciesFilter: AssetDependencyFilter.CannotBeSharedViaComposite,
    dependenciesTableOptionalAttributesToShow: new Set([
      OptionalDependencyAttribute.AssetType,
      OptionalDependencyAttribute.Creator,
    ]),
    displayDependenciesInNewModal: true,
    modalTitleTranslationKey: 'Label.UnsupportedAssets',
    shouldShowDependencies: true,
    shouldFetchCreatorNameForDependencies: true,
  },
  [DependenciesAlertType.MakingDecalOpenUse]: {
    alertTitleTranslationKey: 'Heading.DependenciesAlertTitleMakingDecalOpenUse',
    alertSubtitleTranslationKey: 'Description.DependenciesAlertSubtitleMakingDecalOpenUse',
    alertLearnMoreLink: ASSET_ACCESS_PRIVACY,
    dependenciesDescriptionTranslationKey: null,
    dependenciesFilter: AssetDependencyFilter.All, // No filter is needed for Decals as they should always have a single Image dependency
    dependenciesTableOptionalAttributesToShow: null,
    displayDependenciesInNewModal: false,
    modalTitleTranslationKey: null,
    shouldShowDependencies: true,
    shouldFetchCreatorNameForDependencies: false,
  },
  [DependenciesAlertType.SellingPaidModel]: {
    alertTitleTranslationKey: 'Heading.DependenciesAlertTitleSellingPaidModel',
    alertSubtitleTranslationKey: 'Description.DependenciesAlertSubtitleSellingPaidModel',
    alertLearnMoreLink: ASSET_ACCESS_PRIVACY, // TODO: Change to Store-specific docs
    dependenciesDescriptionTranslationKey: 'Description.DependenciesDescriptionSellingPaidModel',
    dependenciesFilter: AssetDependencyFilter.ShouldBeMadeRestrictedBeforeIncludingInPaidComposite,
    dependenciesTableOptionalAttributesToShow: new Set([OptionalDependencyAttribute.AssetType]),
    displayDependenciesInNewModal: false,
    modalTitleTranslationKey: null,
    shouldShowDependencies: true,
    shouldFetchCreatorNameForDependencies: false, // We only show dependencies for the parent creator
  },
};

export default alertTypeConstants;
