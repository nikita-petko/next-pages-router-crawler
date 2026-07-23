import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, SystemBanner } from '@rbx/foundation-ui';
import { withTranslation, useLocalization, useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  makeStyles,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
} from '@rbx/ui';
import type { PreviewSubmissionsResponse } from '@modules/clients/experienceQuestionnaire';
import { PageLoading, Link } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ContextBanner from '../../../components/ContextBanner';
import { POLICY_API_LINKS } from '../../../constants/questionnaireConstants';
import useQuestionnaireToast from '../../../hooks/useQuestionnaireToast';
import useCommonTableStyles from '../../../utils/commonTableStyles';
import { usePublishQuestionnaires, usePreviewMultiQuestionnaireV2 } from '../../../utils/queries';

interface QuestionnairePreviewV2Props {
  universeId: number;
  mainQuestionnaireId: string;
  additionalQuestionnaireId: string;
  onPublish: () => void;
  onBack: () => void;
  onCancel: () => void;
  actionBarContainer?: HTMLElement | null;
  isOverEighteenQuestionnaire: boolean;
}

interface RatingEntry {
  systemName: string;
  systemLabel: string;
  regionName: string;
  ratingCode: string;
  ratingLabel: string;
  ageRatingIconUrl: string;
  interactiveElements: string;
  iarcDescriptors: string;
  robloxDescriptors: string[];
}

enum PreviewPage {
  VersionsTable,
  MaturityLabelsAndRatings,
}

const gridContentStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 'var(--gap-large)',
};

const scrollableTableStyle: CSSProperties = {
  overflowX: 'auto',
  maxWidth: '100%',
};

const HeaderCell = ({ children }: { children: ReactNode }) => (
  <TableCell>
    <div className='flex items-center gap-small'>
      <span className='text-label-medium'>{children}</span>
    </div>
  </TableCell>
);

const ScrollableTable = ({ children, className }: { children: ReactNode; className: string }) => (
  <div style={scrollableTableStyle}>
    <Table className={className}>{children}</Table>
  </div>
);

const useStyles = makeStyles()((theme) => ({
  accordionRoot: {
    border: 'unset',
    borderBottom: `1px solid ${theme.palette.components.divider}`,
    '&.Mui-expanded': {
      margin: 0,
    },
    '::before': {
      content: 'none',
    },
  },
  accordionSummaryContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 'var(--padding-small)',
    display: 'flex',
    gap: 'var(--gap-medium)',
  },
}));

const generateVersions = (policyList: { id: string; label: string }[]) => {
  const numPolicies = policyList.length;
  const numVersions = 2 ** numPolicies;
  const versions: Record<string, boolean>[] = [];

  for (let i = 0; i < numVersions; i += 1) {
    const version: Record<string, boolean> = {};
    policyList.forEach((policy, index) => {
      const bit = Math.floor(i / 2 ** index) % 2;
      version[policy.id] = bit === 1;
    });
    versions.push(version);
  }

  return versions;
};

const formatVersionLabel = (index: number): string => `${index + 1}`;

const QuestionnairePreviewV2: FunctionComponent<QuestionnairePreviewV2Props> = ({
  universeId,
  mainQuestionnaireId,
  additionalQuestionnaireId,
  onPublish,
  onBack,
  onCancel,
  actionBarContainer,
  isOverEighteenQuestionnaire,
}) => {
  const [currentPage, setCurrentPage] = useState<PreviewPage>(PreviewPage.VersionsTable);
  const { showToastNetworkError } = useQuestionnaireToast();
  const { locale } = useLocalization();
  const { translate, translateHTML, translateWithNamespace } = useTranslation();

  const isU18 = !isOverEighteenQuestionnaire;

  const {
    mutateAsync: previewMultiQuestionnaire,
    data: previewData,
    isPending: isPreviewPending,
    isError: isPreviewError,
  } = usePreviewMultiQuestionnaireV2(universeId);

  const previewRequestedRef = useRef(false);
  useEffect(() => {
    if (!mainQuestionnaireId || !additionalQuestionnaireId || previewRequestedRef.current) {
      return;
    }
    previewRequestedRef.current = true;
    previewMultiQuestionnaire({
      questionnaireIds: [mainQuestionnaireId, additionalQuestionnaireId],
      localeCode: locale,
    }).catch(() => {
      showToastNetworkError(500);
    });
  }, [
    locale,
    previewMultiQuestionnaire,
    mainQuestionnaireId,
    additionalQuestionnaireId,
    showToastNetworkError,
  ]);

  const preview: PreviewSubmissionsResponse | undefined = previewData;

  const policies =
    preview?.referencedContentDescriptors
      ?.filter((contentDescriptor) => contentDescriptor.complianceApiSupported)
      .map((contentDescriptor) => ({
        id: contentDescriptor.displayName ?? '',
        label: contentDescriptor.displayName ?? '',
      })) ?? [];

  const versions = generateVersions(policies);

  const descriptorUsages = preview?.ageRecommendationDetails?.descriptorUsages ?? [];

  const ageRecommendation = preview?.ageRecommendationDetails?.summary?.ageRecommendation;
  const contentMaturityLabel = ageRecommendation?.displayName ?? '';
  const isRestricted = (ageRecommendation?.minimumAge ?? 0) >= 18;

  const restrictedCountries = preview?.restrictedCountries ?? [];

  const robloxDescriptors =
    preview?.ageRecommendationDetails?.descriptorUsages
      ?.map((usage) => usage.descriptor?.displayName)
      .filter((name): name is string => Boolean(name)) ?? [];

  const ratings =
    preview?.robloxProducts?.flatMap((product) => {
      return (
        product.iarcProduct?.ratingList?.map((rating) => {
          const interactiveElements =
            rating.interactiveElementList
              ?.map((elem) => elem.localizedDisplayText)
              .filter(Boolean)
              .join(', ') ?? '';

          const iarcDescriptors =
            rating.descriptorList
              ?.map((desc) => desc.localizedDisplayText)
              .filter(Boolean)
              .join(', ') ?? '';

          return {
            systemName: rating.ratingAuthorityShortText ?? '',
            systemLabel: rating.ratingAuthorityShortText ?? '',
            regionName: rating.localizedRegionText ?? '',
            ratingCode: rating.ageRatingShortText ?? '',
            ratingLabel: rating.localizedDisplayText ?? '',
            ageRatingIconUrl: rating.ageRatingIconUrl ?? '',
            interactiveElements,
            iarcDescriptors,
            robloxDescriptors,
          };
        }) ?? []
      );
    }) ?? [];

  const sortedRatings = [...ratings].sort((a, b) => a.systemName.localeCompare(b.systemName));

  const { mutateAsync: publishQuestionnaires, isPending: isPublishing } =
    usePublishQuestionnaires(universeId);

  const {
    classes: { accordionRoot, accordionSummaryContent },
  } = useStyles();
  const {
    classes: { borderedTable },
  } = useCommonTableStyles();

  const handlePublish = async () => {
    if (!mainQuestionnaireId || !additionalQuestionnaireId) {
      showToastNetworkError(500);
      return;
    }

    try {
      await publishQuestionnaires({
        mainQuestionnaireId,
        additionalQuestionnaireId,
      });
      onPublish();
    } catch {
      showToastNetworkError(500);
    }
  };

  const handleContinue = () => {
    setCurrentPage(PreviewPage.MaturityLabelsAndRatings);
  };

  const handleBackToVersions = () => {
    setCurrentPage(PreviewPage.VersionsTable);
  };

  const formatPolicyValue = (isVisible: boolean): string => {
    return isVisible ? translate('Label.On') : translate('Label.Off');
  };

  const hasPolicies = policies.length > 0;
  const isVersionsPage = hasPolicies && currentPage === PreviewPage.VersionsTable;

  if (isPreviewPending) {
    return <PageLoading />;
  }

  if (isPreviewError) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        onReload={() => window.location.reload()}
      />
    );
  }

  const actionBar = (
    <div className='flex justify-between items-center gap-medium padding-top-medium'>
      <div className='flex items-center gap-medium'>
        <Button variant='Utility' size='Medium' onClick={onCancel}>
          {translate('Button.Cancel')}
        </Button>
        {!isVersionsPage && isPublishing && (
          <span className='text-body-small content-muted'>{translate('Progress.Publishing')}</span>
        )}
      </div>
      <div className='flex gap-small'>
        {isVersionsPage ? (
          <>
            <Button variant='Utility' size='Medium' onClick={onBack}>
              {translate('Button.Back')}
            </Button>
            <Button variant='Emphasis' size='Medium' onClick={handleContinue}>
              {translate('Button.Continue')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant='Utility'
              size='Medium'
              onClick={hasPolicies ? handleBackToVersions : onBack}>
              {translate('Button.Back')}
            </Button>
            <Button
              variant='Emphasis'
              size='Medium'
              onClick={handlePublish}
              isDisabled={isPublishing || !!preview?.disableSubmitButton}
              isLoading={isPublishing}>
              {translate('Action.Send')}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Grid
        container
        flexDirection='column'
        gap='var(--gap-xxlarge)'
        style={{ minWidth: 0, overflow: 'hidden' }}>
        {isVersionsPage ? (
          <>
            <div style={gridContentStyle}>
              <Typography variant='h5'>
                {translate('Title.ReviewQuestionnaireVersionsMarch')}
              </Typography>
              <Typography className='content-muted'>
                {translate('Description.ReviewQuestionnaireVersionsMarch')}
              </Typography>
            </div>

            <ScrollableTable className={`${borderedTable} radius-medium clip`}>
              <TableHead>
                <TableRow>
                  <HeaderCell>{translate('Label.QuestionnaireVersionColumn')}</HeaderCell>
                  {policies.map((policy) => (
                    <HeaderCell key={policy.id}>{policy.label}</HeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((version, index) => {
                  const versionKey = `version-${index}-${policies
                    .map((p) => (version[p.id] ? '1' : '0'))
                    .join('')}`;
                  return (
                    <TableRow key={versionKey}>
                      <TableCell>
                        <span className='text-body-medium'>{formatVersionLabel(index)}</span>
                      </TableCell>
                      {policies.map((policy) => (
                        <TableCell key={policy.id}>
                          <span className='text-body-medium'>
                            {formatPolicyValue(version[policy.id])}
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </ScrollableTable>
          </>
        ) : (
          <div className='flex flex-col gap-medium'>
            {isRestricted && (
              <SystemBanner
                title=''
                description={translate('Description.RestrictedContentPreview')}
                variant='Standard'
                severity='Info'
                primaryActionLabel={translate('Action.LearnMore')}
                onPrimaryAction={() =>
                  window.open(
                    'https://en.help.roblox.com/hc/en-us/articles/15869919570708-Restricted-Content-Policy',
                    '_blank',
                  )
                }
              />
            )}
            <Accordion square variant='outlined' classes={{ root: accordionRoot }} defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                classes={{ content: accordionSummaryContent }}>
                <span className='text-heading-small'>
                  {translate('Title.PreviewContentMaturityRatings')}
                </span>
              </AccordionSummary>
              <AccordionDetails>
                <div style={gridContentStyle}>
                  <Typography className='content-muted'>
                    {translate('Description.RobloxMaturityLabel')}
                  </Typography>

                  <ScrollableTable className={`${borderedTable} radius-medium clip`}>
                    <TableHead>
                      <TableRow>
                        <HeaderCell>{translate('Label.Rating')}</HeaderCell>
                        <HeaderCell>{translate('TableHead.Descriptors')}</HeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <span className='text-body-medium'>{contentMaturityLabel || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-col'>
                            {descriptorUsages
                              .map((usage) => usage.descriptor?.displayName)
                              .filter(Boolean)
                              .map((name) => (
                                <span key={name} className='text-body-medium'>
                                  {name}
                                </span>
                              ))}
                            {descriptorUsages.length === 0 && (
                              <span className='text-body-medium'>—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </ScrollableTable>
                </div>
              </AccordionDetails>
            </Accordion>

            <Accordion square variant='outlined' classes={{ root: accordionRoot }} defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                classes={{ content: accordionSummaryContent }}>
                <span className='text-heading-small'>{translate('Title.PreviewIARCRatings')}</span>
              </AccordionSummary>
              <AccordionDetails>
                <div style={gridContentStyle}>
                  <Typography className='content-muted'>
                    {translateHTML('Description.ReviewRatingsMarch', [
                      {
                        opening: 'PolicyServiceApiLinkStart',
                        closing: 'PolicyServiceApiLinkEnd',
                        content(chunks: ReactNode) {
                          return (
                            <Link href={POLICY_API_LINKS} target='_blank'>
                              {chunks}
                            </Link>
                          );
                        },
                      },
                    ])}
                  </Typography>

                  {isU18 && (
                    <ContextBanner
                      description={translateWithNamespace(
                        TranslationNamespace.DeveloperQuestionnaire,
                        'Description.U18IARCUnsupported',
                      )}
                      linkLabel={translate('Action.LearnMore')}
                      linkHref='https://en.help.roblox.com/hc/en-us/articles/15869919570708-Restricted-Content-Policy'
                    />
                  )}

                  <ScrollableTable className={`${borderedTable} radius-medium clip`}>
                    <TableHead>
                      <TableRow>
                        <HeaderCell>{translate('Label.RatingSystem')}</HeaderCell>
                        <HeaderCell>{translate('Label.Rating')}</HeaderCell>
                        <HeaderCell>{translate('Label.InteractiveElements')}</HeaderCell>
                        <HeaderCell>{translate('Label.IARCDescriptors')}</HeaderCell>
                        <HeaderCell>{translate('Label.RobloxDescriptors')}</HeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedRatings.length > 0 ? (
                        sortedRatings.map((rating: RatingEntry) => (
                          <TableRow key={`${rating.systemName}-${rating.ratingCode}`}>
                            <TableCell>
                              <div className='flex flex-col gap-xsmall'>
                                <span className='text-body-medium'>{rating.systemName}</span>
                                {rating.regionName && (
                                  <span className='text-body-small content-muted'>
                                    {rating.regionName}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-small'>
                                {rating.ageRatingIconUrl && (
                                  <img
                                    src={rating.ageRatingIconUrl}
                                    alt={rating.ratingCode}
                                    className='height-[32px] width-[32px] radius-small'
                                  />
                                )}
                                <span className='text-body-medium'>{rating.ratingLabel}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className='text-body-medium'>{rating.interactiveElements}</span>
                            </TableCell>
                            <TableCell>
                              <span className='text-body-medium'>{rating.iarcDescriptors}</span>
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col'>
                                {rating.robloxDescriptors.map((name) => (
                                  <span key={name} className='text-body-medium'>
                                    {name}
                                  </span>
                                ))}
                                {rating.robloxDescriptors.length === 0 && (
                                  <span className='text-body-medium'>—</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </ScrollableTable>
                </div>
              </AccordionDetails>
            </Accordion>

            <Accordion square variant='outlined' classes={{ root: accordionRoot }} defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                classes={{ content: accordionSummaryContent }}>
                <span className='text-heading-small'>
                  {translate('Title.PreviewRegionalLimitations')}
                </span>
              </AccordionSummary>
              <AccordionDetails>
                <div style={gridContentStyle}>
                  <Typography className='content-muted'>
                    {translateHTML('Description.NonCompliantRegions', [
                      {
                        opening: 'policyApisLinkStart',
                        closing: 'policyApisLinkEnd',
                        content(chunks) {
                          return (
                            <Link
                              href='https://create.roblox.com/docs/reference/engine/classes/PolicyService'
                              target='_blank'>
                              {chunks}
                            </Link>
                          );
                        },
                      },
                    ])}
                  </Typography>

                  <ScrollableTable className={`${borderedTable} radius-medium clip`}>
                    <TableHead>
                      <TableRow>
                        <HeaderCell>{translate('Title.Location')}</HeaderCell>
                        <HeaderCell>{translate('TableHead.Descriptors')}</HeaderCell>
                        <HeaderCell>{translate('Title.GuidelinesAgeRestriction')}</HeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {restrictedCountries.length > 0 ? (
                        restrictedCountries.map((country, index) => (
                          <TableRow key={country.countryCode ?? index}>
                            <TableCell>
                              <span className='text-body-medium'>
                                {country.displayCountryName ?? '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className='text-body-medium'>
                                {country.displayDescriptorName ?? '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className='text-body-medium'>
                                {country.displayAgeRangeName ?? '—'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                          <TableCell>
                            <span className='text-body-medium'>—</span>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </ScrollableTable>
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        )}
      </Grid>
      {actionBarContainer && createPortal(actionBar, actionBarContainer)}
    </>
  );
};

export default withTranslation(QuestionnairePreviewV2, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
