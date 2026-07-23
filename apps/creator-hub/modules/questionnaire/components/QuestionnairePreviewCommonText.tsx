import React, { FunctionComponent } from 'react';
import { Link, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useExperienceGuidelinesStyles from '../containers/ExperienceGuidelines.styles';
import { POLICY_API_LINKS, EXPERIENCE_GUIDELINES_LINKS } from '../constants/questionnaireConstants';

export interface QuestionnairePreviewCommonTextProps {
  isContentMaturityEnabled: boolean;
}

const QuestionnairePreviewCommonText: FunctionComponent<
  React.PropsWithChildren<QuestionnairePreviewCommonTextProps>
> = (isContentMaturityEnabled) => {
  const {
    classes: { boldText, commonTextDiv, guidelinesImpact, unorderedList },
  } = useExperienceGuidelinesStyles();
  const { translate, translateHTML } = useTranslation();

  return (
    <div className={commonTextDiv}>
      <Typography variant='body1'>
        {translateHTML(
          isContentMaturityEnabled
            ? 'Message.ImpactOfContentMaturityPreview'
            : 'Message.ImpactOfGuidelinesPreview',
          [
            {
              opening: 'experienceGuidelinesLinkStart',
              closing: 'experienceGuidelinesLinkEnd',
              content(chunks) {
                return (
                  <Link href={EXPERIENCE_GUIDELINES_LINKS} target='_blank' underline='always'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        )}
      </Typography>
      <ul className={unorderedList}>
        <li>
          <Typography variant='body1'>
            {translateHTML(
              isContentMaturityEnabled
                ? 'Message.ImpactOfContentMaturityLabelPreview'
                : 'Message.ImpactOfGuidelinesAgeRecommendationPreview',
              [
                {
                  opening: 'boldStart',
                  closing: 'boldEnd',
                  content(chunks) {
                    return <span className={boldText}>{chunks}</span>;
                  },
                },
              ],
            )}
          </Typography>
        </li>
        <li>
          <Typography variant='body1'>
            {translateHTML(
              isContentMaturityEnabled
                ? 'Message.ImpactOfMaturityRegionalCompliancePreview'
                : 'Message.ImpactOfGuidelinesRegionalCompliancePreview',
              [
                {
                  opening: 'boldStart',
                  closing: 'boldEnd',
                  content(chunks) {
                    return <span className={boldText}>{chunks}</span>;
                  },
                },
              ],
            )}
          </Typography>
        </li>
      </ul>
      <div className={guidelinesImpact}>
        <Typography variant='body1'>
          {translateHTML('Message.LearnMoreAboutExperienceGuideline', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks) {
                return (
                  <Link href={POLICY_API_LINKS} target='_blank' underline='always'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
      </div>
    </div>
  );
};

export default QuestionnairePreviewCommonText;
