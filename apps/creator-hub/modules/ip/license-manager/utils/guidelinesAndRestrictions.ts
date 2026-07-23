import type {
  ContentStandardQuestionAnswerRequest,
  ContentStandardsQuestionAnswer,
} from '@rbx/client-content-licensing-api/v1';
import {
  ContentStandardAnswer,
  ContentStandardAnswerFromJSON,
} from '@rbx/client-content-licensing-api/v1';

// Defined in content-licensing BE - services/ip-licensing-service/src/Implementation/ContentStandardsValidator.cs
export enum ContentStandardsStatements {
  CharacterInclusion = 'creator_inspired_content',
  ThemeIntegration = 'integrate_pre_existing_experience',
  LogoUsage = 'use_official_logos',
  CosmeticItemCreation = 'create_fan_cosmetics',
  CombiningIp = 'combine_ip_original_content',
  MixingIp = 'mix_other_ips',
  LicensedBranding = 'brand_as_official',
  AlteringIp = 'alter_ip_canon',
  DerivativeIpUsage = 'use_derivative_works',
  RealWorldLikeness = 'use_actor_likeness',
  ExternalIp = 'associate_external_brands',
  VideoCreation = 'use_video_clips',
}

const CONTENT_STANDARDS_STATEMENT_IDS = new Set<string>(Object.values(ContentStandardsStatements));

function isContentStandardsStatement(questionId: string): questionId is ContentStandardsStatements {
  return CONTENT_STANDARDS_STATEMENT_IDS.has(questionId);
}

export const convertToContentStandardAnswer = (
  answer?: string | null,
): ContentStandardAnswer | undefined => {
  if (!answer) {
    return undefined;
  }
  switch (answer) {
    case 'Yes':
      return ContentStandardAnswer.Yes;
    case 'No':
      return ContentStandardAnswer.No;
    case 'NotApplicable':
      return ContentStandardAnswer.NotApplicable;
    default:
      return undefined;
  }
};

// Returns the label key shown to Rights holders so they can make a selection
// Follows the pattern "Can Creators ... ?" (generally)
export const getLabelFromContentStandardQuestion = (questionId: string) => {
  if (!isContentStandardsStatement(questionId)) {
    return 'Label.Unknown';
  }
  switch (questionId) {
    case ContentStandardsStatements.CharacterInclusion: {
      return 'Label.ContentStandardsStatementCharacterInclusion';
    }
    case ContentStandardsStatements.ThemeIntegration: {
      return 'Label.ContentStandardsStatementThemeIntegration';
    }
    case ContentStandardsStatements.LogoUsage: {
      return 'Label.ContentStandardsStatementLogoUsage';
    }
    case ContentStandardsStatements.CosmeticItemCreation: {
      return 'Label.ContentStandardsStatementCosmeticItemCreation';
    }
    case ContentStandardsStatements.CombiningIp: {
      return 'Label.ContentStandardsStatementCombiningIp';
    }
    case ContentStandardsStatements.MixingIp: {
      return 'Label.ContentStandardsStatementMixingIpV2';
    }
    case ContentStandardsStatements.LicensedBranding: {
      return 'Label.ContentStandardsStatementLicensedBranding';
    }
    case ContentStandardsStatements.AlteringIp: {
      return 'Label.ContentStandardsStatementAlteringIp';
    }
    case ContentStandardsStatements.DerivativeIpUsage: {
      return 'Label.ContentStandardsStatementDerivativeIpUsage';
    }
    case ContentStandardsStatements.RealWorldLikeness: {
      return 'Label.ContentStandardsStatementRealWorldLikeness';
    }
    case ContentStandardsStatements.ExternalIp: {
      return 'Label.ContentStandardsStatementExternalIp';
    }
    case ContentStandardsStatements.VideoCreation: {
      return 'Label.ContentStandardsStatementVideoCreation';
    }
    default: {
      return 'Label.Unknown';
    }
  }
};

// Returns the label key shown to both Creators and Rights holders after a selection is made
// Follows the pattern "Creators are allowed / not allowed to ..." (generally)
export const getLabelFromContentStandardQuestionAnswer = (
  statement: ContentStandardsQuestionAnswer,
) => {
  const questionId = statement.questionId ?? '';
  const isAllowed = statement.answer === ContentStandardAnswer.Yes;

  if (!isContentStandardsStatement(questionId)) {
    return 'Label.Unknown';
  }
  switch (questionId) {
    case ContentStandardsStatements.CharacterInclusion: {
      return isAllowed
        ? 'Label.ContentStandardsStatementCharacterInclusionAllowed'
        : 'Label.ContentStandardsStatementCharacterInclusionNotAllowed';
    }
    case ContentStandardsStatements.ThemeIntegration: {
      return isAllowed
        ? 'Label.ContentStandardsStatementThemeIntegrationAllowed'
        : 'Label.ContentStandardsStatementThemeIntegrationNotAllowed';
    }
    case ContentStandardsStatements.LogoUsage: {
      return isAllowed
        ? 'Label.ContentStandardsStatementLogoUsageAllowed'
        : 'Label.ContentStandardsStatementLogoUsageNotAllowed';
    }
    case ContentStandardsStatements.CosmeticItemCreation: {
      return isAllowed
        ? 'Label.ContentStandardsStatementCosmeticItemCreationAllowed'
        : 'Label.ContentStandardsStatementCosmeticItemNotAllowed';
    }
    case ContentStandardsStatements.CombiningIp: {
      return isAllowed
        ? 'Label.ContentStandardsStatementCombiningIpAllowed'
        : 'Label.ContentStandardsStatementCombiningIpNotAllowed';
    }
    case ContentStandardsStatements.MixingIp: {
      return isAllowed
        ? 'Label.ContentStandardsStatementMixingIpAllowedV2'
        : 'Label.ContentStandardsStatementMixingIpNotAllowedV2';
    }
    case ContentStandardsStatements.LicensedBranding: {
      return isAllowed
        ? 'Label.ContentStandardsStatementLicensedBrandingAllowed'
        : 'Label.ContentStandardsStatementLicensedBrandingNotAllowed';
    }
    case ContentStandardsStatements.AlteringIp: {
      return isAllowed
        ? 'Label.ContentStandardsStatementAlteringIpAllowed'
        : 'Label.ContentStandardsStatementAlteringIpNotAllowed';
    }
    case ContentStandardsStatements.DerivativeIpUsage: {
      return isAllowed
        ? 'Label.ContentStandardsStatementDerivativeIpUsageAllowed'
        : 'Label.ContentStandardsStatementDerivativeIpUsageNotAllowed';
    }
    case ContentStandardsStatements.RealWorldLikeness: {
      return isAllowed
        ? 'Label.ContentStandardsStatementRealWorldLikenessAllowed'
        : 'Label.ContentStandardsStatementRealWorldLikenessNotAllowed';
    }
    case ContentStandardsStatements.ExternalIp: {
      return isAllowed
        ? 'Label.ContentStandardsStatementExternalIpAllowed'
        : 'Label.ContentStandardsStatementExternalIpNotAllowed';
    }
    case ContentStandardsStatements.VideoCreation: {
      return isAllowed
        ? 'Label.ContentStandardsStatementVideoCreationAllowed'
        : 'Label.ContentStandardsStatementVideoCreationNotAllowed';
    }
    default: {
      return 'Label.Unknown';
    }
  }
};

export const mockContentStandardsStatements: ContentStandardsQuestionAnswer[] = [
  {
    questionId: ContentStandardsStatements.CharacterInclusion,
    answer: ContentStandardAnswer.Yes,
  },
  {
    questionId: ContentStandardsStatements.ThemeIntegration,
    answer: ContentStandardAnswer.No,
  },
  {
    questionId: ContentStandardsStatements.LogoUsage,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.CosmeticItemCreation,
    answer: ContentStandardAnswer.Yes,
  },
  {
    questionId: ContentStandardsStatements.CombiningIp,
    answer: ContentStandardAnswer.No,
  },
  {
    questionId: ContentStandardsStatements.MixingIp,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.LicensedBranding,
    answer: ContentStandardAnswer.Yes,
  },
  {
    questionId: ContentStandardsStatements.AlteringIp,
    answer: ContentStandardAnswer.No,
  },
  {
    questionId: ContentStandardsStatements.DerivativeIpUsage,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.RealWorldLikeness,
    answer: ContentStandardAnswer.Yes,
  },
  {
    questionId: ContentStandardsStatements.ExternalIp,
    answer: ContentStandardAnswer.No,
  },
  {
    questionId: ContentStandardsStatements.VideoCreation,
    answer: ContentStandardAnswer.NotApplicable,
  },
];

export const mockContentStandardsStatementsAllNotApplicable: ContentStandardsQuestionAnswer[] = [
  {
    questionId: ContentStandardsStatements.CharacterInclusion,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.ThemeIntegration,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.LogoUsage,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.CosmeticItemCreation,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.CombiningIp,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.MixingIp,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.LicensedBranding,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.AlteringIp,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.DerivativeIpUsage,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.RealWorldLikeness,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.ExternalIp,
    answer: ContentStandardAnswer.NotApplicable,
  },
  {
    questionId: ContentStandardsStatements.VideoCreation,
    answer: ContentStandardAnswer.NotApplicable,
  },
];

// Convert ContentStandardsQuestionAnswer to ContentStandardQuestionAnswerRequest
export const convertContentStandardsQuestionAnswerToRequest = (
  contentStandardsQuestionAnswers: ContentStandardsQuestionAnswer[],
): ContentStandardQuestionAnswerRequest[] => {
  return (
    contentStandardsQuestionAnswers.map((contentStandardQuestionAnswer) => {
      return {
        questionId: contentStandardQuestionAnswer.questionId ?? '',
        answer: ContentStandardAnswerFromJSON(contentStandardQuestionAnswer.answer),
      };
    }) ?? undefined
  );
};
