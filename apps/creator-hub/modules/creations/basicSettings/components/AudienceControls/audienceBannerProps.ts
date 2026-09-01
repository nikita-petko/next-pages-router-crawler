import type { TFeedbackBannerProps } from '@rbx/foundation-ui';
import type {
  TPendingTranslationFunction,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { AudienceValidationState } from './audienceValidation';

export type AudienceBannerCallbacks = {
  translate: TranslationKeyToFormattedText;
  tPendingTranslation: TPendingTranslationFunction;
  onViewMyPermissions: () => void;
  onAddLabel: () => void;
  onReachMorePlayers: () => void;
  onViewAudienceReach: () => void;
  selectLossDocsUrl: string;
};

const exhaustiveCheck = (value: never): never => {
  throw new Error(`Unhandled audience validation state: ${JSON.stringify(value)}`);
};

export const mapStateToBannerProps = (
  state: AudienceValidationState,
  callbacks: AudienceBannerCallbacks,
): TFeedbackBannerProps | null => {
  const { translate, tPendingTranslation } = callbacks;
  switch (state.type) {
    case 'none':
      return null;
    case 'error': {
      const errorKind = state.kind;
      switch (errorKind) {
        case 'user-tier-private':
          return {
            title: '',
            severity: 'Error',
            layout: 'Inline',
            description: translate(
              translationKey(
                'Description.AudienceUserTierPrivate',
                TranslationNamespace.ConfigureItem,
              ),
            ),
            primaryActionLabel: translate(
              translationKey('Action.ViewMyPermissions', TranslationNamespace.ConfigureItem),
            ),
            onPrimaryAction: callbacks.onViewMyPermissions,
          };
        case 'creator-tier-private':
          return {
            title: '',
            severity: 'Error',
            layout: 'Inline',
            description: translate(
              translationKey(
                'Description.AudienceCreatorTierPrivate',
                TranslationNamespace.ConfigureItem,
              ),
            ),
            primaryActionLabel: tPendingTranslation(
              'View Audience reach',
              'Action label on the error banner shown when the experience owner is at the Private creator tier; navigates to the experience audience reach page',
              translationKey('Action.ViewAudienceReach', TranslationNamespace.ConfigureItem),
            ),
            onPrimaryAction: callbacks.onViewAudienceReach,
          };
        case 'questionnaire-incomplete':
          return {
            title: '',
            severity: 'Error',
            layout: 'Inline',
            description: translate(
              translationKey(
                'Description.AudienceContentMaturityLabelRequired',
                TranslationNamespace.ConfigureItem,
              ),
            ),
            primaryActionLabel: translate(
              translationKey('Action.AddLabel', TranslationNamespace.ConfigureItem),
            ),
            onPrimaryAction: callbacks.onAddLabel,
          };
        case 'public-required':
          return {
            title: '',
            severity: 'Error',
            layout: 'Inline',
            description: translate(
              translationKey(
                'Description.AudiencePublicRequiredForPaidAccess',
                TranslationNamespace.ConfigureItem,
              ),
            ),
          };
        default:
          return exhaustiveCheck(errorKind);
      }
    }
    case 'warning': {
      const warningKind = state.kind;
      switch (warningKind) {
        case 'select-loss':
          return {
            title: '',
            severity: 'Warning',
            layout: 'Inline',
            description: tPendingTranslation(
              'Publishing reach at risk. At next publish, your game will lose access to its current audience reach.',
              'Description of the warning banner shown when the experience is about to lose its current publishing reach (Select eligibility) on next publish',
              translationKey(
                'Description.AudiencePublishingReachAtRisk',
                TranslationNamespace.ConfigureItem,
              ),
            ),
            primaryActionLabel: tPendingTranslation(
              'View eligibility',
              'Action label on the warning banner shown when the user is about to lose Select eligibility; opens the eligibility docs',
              translationKey('Action.RestoreSelectEligibility', TranslationNamespace.ConfigureItem),
            ),
            onPrimaryAction: () => {
              location.href = callbacks.selectLossDocsUrl;
            },
          };
        default:
          return exhaustiveCheck(warningKind);
      }
    }
    case 'info': {
      const infoKind = state.kind;
      switch (infoKind) {
        case 'limited-reach':
          return {
            title: '',
            severity: 'Info',
            layout: 'Inline',
            description: translate(
              translationKey(
                'Description.AudienceLimitedReach',
                TranslationNamespace.ConfigureItem,
              ),
            ),
            primaryActionLabel: translate(
              translationKey('Action.ReachMorePlayers', TranslationNamespace.ConfigureItem),
            ),
            onPrimaryAction: callbacks.onReachMorePlayers,
          };
        default:
          return exhaustiveCheck(infoKind);
      }
    }
    default:
      return exhaustiveCheck(state);
  }
};
