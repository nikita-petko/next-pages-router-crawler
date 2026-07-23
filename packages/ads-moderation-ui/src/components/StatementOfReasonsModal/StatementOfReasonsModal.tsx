import { AssetThumbnailSize, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Button, Link, OpenInNewIcon, Typography } from '@rbx/ui';
import React, { type JSX, ReactNode } from 'react';

import useStatementOfReasonsModalStyles from './StatementOfReasonsModal.styles';
import { adPolicyLabelEnumToText } from '../../utils/adPolicyLabels';
import { GetSitetestBaseUrl } from '../../utils/url';

export type StatementOfReasonsModalProps = {
  adPolicyReviewLabels: number[];
  appealUrl?: string;
  assetId: number | undefined;
  decisionDate: string;
  headingKey?: string;
  onClose: () => void;
  isLabelRejected?: boolean;
  translate: (key: string, args?: { [key: string]: string }) => string;
  translateHTML: (
    key: string,
    tags?: Array<{
      closing: string;
      content: (chunks: ReactNode) => ReactNode;
      opening: string;
    }> | null,
    args?: { [key: string]: string | ReactNode },
  ) => ReactNode;
};

const TERMS_OF_USE_URL =
  'https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use';
const COMMUNITY_GUIDELINES_URL =
  'https://en.help.roblox.com/hc/en-us/articles/203313410-Roblox-Community-Standards';
const ADVERTISING_STANDARDS_URL =
  'https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards';
const APPEAL_MODERATION_URL =
  'https://en.help.roblox.com/hc/en-us/articles/360000245263-Appeal-Your-Content-or-Account-Moderation';
const AD_INTEGRATIONS_DOCS_URL =
  'https://create.roblox.com/docs/production/promotion/ad-integrations#ad-integration-tags';

const StatementOfReasonsModal = ({
  adPolicyReviewLabels,
  appealUrl,
  assetId,
  decisionDate,
  headingKey = 'Heading.AdRemoved',
  isLabelRejected = true,
  onClose,
  translate,
  translateHTML,
}: StatementOfReasonsModalProps): JSX.Element => {
  const {
    classes: {
      actionsRow,
      bottomTextMargin,
      grayPanel,
      grayPanelGrid,
      imageRow,
      imageWrapper,
      infoGrid,
      link,
      mutedText,
      rootContainer,
      standard,
      standardBold,
      thumbnailImage,
    },
  } = useStatementOfReasonsModalStyles();
  const advertisingStandardLabels = Array.from(
    new Set(
      adPolicyReviewLabels
        .map((label) => adPolicyLabelEnumToText.get(label) || 'Other')
        .filter(Boolean),
    ),
  );

  const makeLinkTag = (href: string) => ({
    closing: 'linkEnd',
    content: (chunks: React.ReactNode) => (
      <Link
        className={link}
        href={href}
        rel='noopener noreferrer'
        target='_blank'
        underline='hover'>
        {chunks}
      </Link>
    ),
    opening: 'linkStart',
  });

  const guidelinesLinkTag = {
    closing: 'guidelinesLinkEnd',
    content: (chunks: React.ReactNode) => (
      <Link
        className={link}
        href={COMMUNITY_GUIDELINES_URL}
        rel='noopener noreferrer'
        target='_blank'
        underline='hover'>
        {chunks}
      </Link>
    ),
    opening: 'guidelinesLinkStart',
  };

  const docsLinkTag = {
    closing: 'docsLinkEnd',
    content: (chunks: React.ReactNode) => (
      <Link
        className={link}
        href={AD_INTEGRATIONS_DOCS_URL}
        rel='noopener noreferrer'
        target='_blank'
        underline='hover'>
        {chunks}
      </Link>
    ),
    opening: 'docsLinkStart',
  };

  const standardsLinkTag = {
    closing: 'standardsLinkEnd',
    content: (chunks: React.ReactNode) => (
      <Link
        className={link}
        href={ADVERTISING_STANDARDS_URL}
        rel='noopener noreferrer'
        target='_blank'
        underline='hover'>
        {chunks}
      </Link>
    ),
    opening: 'standardsLinkStart',
  };

  const appealsUrl = appealUrl ?? `https://www.${GetSitetestBaseUrl()}/report-appeals`;

  return (
    <div className={rootContainer}>
      <Typography variant='h4'>{translate(headingKey)}</Typography>

      {isLabelRejected ? (
        <>
          <Typography className={mutedText}>
            {translateHTML('Description.AdViolationNotice', [
              {
                closing: 'touLinkEnd',
                content: (chunks) => (
                  <Link
                    className={link}
                    href={TERMS_OF_USE_URL}
                    rel='noopener noreferrer'
                    target='_blank'
                    underline='hover'>
                    {chunks}
                  </Link>
                ),
                opening: 'touLinkStart',
              },
              guidelinesLinkTag,
              standardsLinkTag,
            ])}
          </Typography>

          <div className={infoGrid}>
            <Typography className={mutedText}>{translate('Label.ReviewDate')}</Typography>
            <Typography className={standardBold}>{decisionDate}</Typography>

            <Typography className={mutedText}>{translate('Label.Decision')}</Typography>
            <Typography className={standardBold}>
              {translate('Description.DecisionNotAutomated')}
            </Typography>
          </div>
        </>
      ) : (
        <>
          <Typography className={mutedText}>
            {translateHTML('Description.LimitedApprovalNotice', [docsLinkTag, standardsLinkTag])}
          </Typography>
          <div className={infoGrid}>
            <Typography className={mutedText}>{translate('Label.ReviewDate')}</Typography>
            <Typography className={standardBold}>{decisionDate}</Typography>
          </div>
        </>
      )}

      <div className={grayPanel}>
        <div className={grayPanelGrid}>
          <Typography className={standard}>{translate('Label.Reason')}</Typography>
          <Typography className={standardBold}>
            {(advertisingStandardLabels.length > 0 ? advertisingStandardLabels : ['Other']).map(
              (advertisingStandardLabel, index) => (
                <React.Fragment key={advertisingStandardLabel}>
                  {index > 0 && <br />}
                  {advertisingStandardLabel}
                </React.Fragment>
              ),
            )}
          </Typography>

          {assetId && (
            <>
              <Typography className={standard}>{translate('Label.OffensiveItem')}</Typography>
              <Typography className={standardBold}>
                {translate('Label.AssetId', { assetId: String(assetId) })}
              </Typography>
            </>
          )}
        </div>

        {assetId && (
          <div className={imageRow}>
            <Thumbnail2d
              alt={translate('Description.CreativeAlt')}
              containerClass={imageWrapper}
              imgClassName={thumbnailImage}
              size={AssetThumbnailSize['_420x420']}
              targetId={assetId}
              type={ThumbnailTypes.assetThumbnail}
            />
          </div>
        )}
      </div>

      {isLabelRejected && (
        <Typography className={mutedText}>
          {translateHTML('Description.FollowGuidelines', [guidelinesLinkTag, standardsLinkTag])}
        </Typography>
      )}
      <Typography className={`${mutedText} ${bottomTextMargin}`}>
        {translateHTML('Description.RequestAppeal', [makeLinkTag(appealsUrl)])}
        <br />
        {translateHTML('Description.LearnMoreAppeals', [makeLinkTag(APPEAL_MODERATION_URL)])}
      </Typography>

      <div className={actionsRow}>
        <Button
          color='primaryBrand'
          component='a'
          endIcon={<OpenInNewIcon fontSize='small' />}
          href={appealsUrl}
          rel='noopener noreferrer'
          target='_blank'
          variant='contained'>
          {translate('Action.Appeal')}
        </Button>
        <Button color='secondary' onClick={onClose} variant='contained'>
          {translate('Action.Close')}
        </Button>
      </div>
    </div>
  );
};

export default StatementOfReasonsModal;
