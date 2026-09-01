import type { FunctionComponent } from 'react';
import React, { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import { POLICY_API_LINKS, EXPERIENCE_GUIDELINES_LINKS } from '../constants/questionnaireConstants';
import useExperienceGuidelinesStyles from '../containers/ExperienceGuidelines.styles';

export interface QuestionnaireProgressCommonTextProps {
  messageKey: string;
  isContentMaturityEnabled: boolean;
}

const QuestionnaireProgressCommonText: FunctionComponent<
  React.PropsWithChildren<QuestionnaireProgressCommonTextProps>
> = ({ messageKey, isContentMaturityEnabled }) => {
  const {
    classes: { boldText, commonTextDiv, guidelinesImpact, unorderedList },
  } = useExperienceGuidelinesStyles();
  const { translate, translateHTML } = useTranslation();

  return (
    <>
      <Typography variant='body1'>
        {translateHTML(messageKey, [
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
        ])}
      </Typography>
      <div className={commonTextDiv}>
        <Typography variant='body1' className={boldText}>
          {translate('Title.ImportantNote')}
        </Typography>
        <ul className={unorderedList}>
          <li>
            <Typography variant='body1'>
              {translateHTML('Message.ImportantNoteRegenerateGuidelines', [
                {
                  opening: 'boldStart',
                  closing: 'boldEnd',
                  content(chunks) {
                    return <span className={boldText}>{chunks}</span>;
                  },
                },
              ])}
            </Typography>
          </li>
          <li>
            <Typography variant='body1'>
              {translateHTML('Message.ImportantNoteAnswersChanged', [
                {
                  opening: 'boldStart',
                  closing: 'boldEnd',
                  content(chunks) {
                    return <span className={boldText}>{chunks}</span>;
                  },
                },
              ])}
            </Typography>
          </li>
        </ul>
        <div className={guidelinesImpact}>
          <Typography variant='body1' className={boldText}>
            {translate('Title.ImpactOfGuidelines')}
          </Typography>
          <br />
          <Typography variant='body1'>
            {isContentMaturityEnabled
              ? translate('Message.ImpactOfContentMaturity')
              : translate('Message.ImpactOfGuidelines')}
          </Typography>
          <ul className={unorderedList}>
            <li>
              <Typography variant='body1'>
                {translateHTML(
                  isContentMaturityEnabled
                    ? 'Message.ImpactOfContentMaturityLabel'
                    : 'Message.ImpactOfGuidelinesAgeRecommendation',
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
                    ? 'Message.ImpactOfContentMaturityRegionalCompliance'
                    : 'Message.ImpactOfGuidelinesRegionalCompliance',
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
        </div>
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
    </>
  );
};

export default QuestionnaireProgressCommonText;
