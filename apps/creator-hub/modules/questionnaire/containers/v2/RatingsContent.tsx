import type { FunctionComponent } from 'react';
import { V2Beta1ModerationStatus } from '@rbx/client-experience-guidelines-service/v1';
import { Badge, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  makeStyles,
} from '@rbx/ui';
import type { GetDetailedGuidelinesResponseV2 } from '@modules/clients/experienceGuidelinesService';
import { CONTENT_UNRATED } from '@modules/experience-guidelines/hooks/useCreatorEligibility';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ContextBanner from '../../components/ContextBanner';
import useCommonTableStyles from '../../utils/commonTableStyles';

export type BadgeStatus = 'NotStarted' | 'Assigned' | 'Pending' | 'Rejected';

interface RatingsContentProps {
  ratingsStatus: BadgeStatus;
  nonCompliantRegionStatus: BadgeStatus;
  detailedGuidelines?: GetDetailedGuidelinesResponseV2;
  isOverEighteenQuestionnaire: boolean;
}

// New translation keys required (register in TranslationHub before launch):
// | Namespace                 | Key                          | English String                                                                                                                                                                                                          |
// | DeveloperQuestionnaire    | Description.U18NoRatings     | "Until a moderator is able to review your game, it will be available to 16+ users in regions where IARC ratings are available. Consider inviting someone 18 or older to take your game's questionnaire sooner."         |
// | DeveloperQuestionnaire    | Description.U18PendingRatings| "You have pending ratings that will automatically update the table below when they're assigned. Consider inviting someone 18 or older to take your game's questionnaire to receive your ratings sooner."                 |
// | DeveloperQuestionnaire    | Action.InviteCollaborator    | "Invite collaborator"                                                                                                                                                                                                   |

const getBadgeVariant = (status: BadgeStatus): 'Alert' | 'Success' | 'Warning' | 'Neutral' => {
  switch (status) {
    case 'Assigned':
      return 'Success';
    case 'Pending':
      return 'Neutral';
    case 'Rejected':
      return 'Alert';
    case 'NotStarted':
      return 'Neutral';
    default:
      return 'Neutral';
  }
};

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

const RatingsContent: FunctionComponent<RatingsContentProps> = ({
  ratingsStatus,
  nonCompliantRegionStatus,
  detailedGuidelines,
  isOverEighteenQuestionnaire,
}) => {
  const {
    classes: { accordionRoot, accordionSummaryContent },
  } = useStyles();
  const {
    classes: { borderedTable },
  } = useCommonTableStyles();
  const { translate, translateHTML, translateWithNamespace } = useTranslation();

  const descriptorUsages =
    detailedGuidelines?.ageRecommendationDetails?.experienceDescriptorUsages?.items ?? [];
  const ageRecommendation =
    detailedGuidelines?.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation;
  const restrictedCountries = detailedGuidelines?.restrictedCountries ?? [];
  const robloxProducts = detailedGuidelines?.robloxProducts ?? [];

  const robloxDescriptors = descriptorUsages.map((d) => d.descriptorDisplayName).filter(Boolean);

  // The API still populates a placeholder displayName (e.g. "Unknown") for experiences without an
  // assigned Roblox maturity label, so rely on the structured contentMaturity field instead. This
  // matches how the rest of the app detects unrated experiences (see useContentRatingDetails,
  // PrivacyStatusBadge): the 'unrated' sentinel or a missing value both mean unrated.
  const contentMaturity = ageRecommendation?.contentMaturity;
  const isUnrated = !contentMaturity || contentMaturity === CONTENT_UNRATED;
  const contentMaturityLabel = isUnrated ? '—' : (ageRecommendation?.displayName ?? '—');

  const robloxMaturityStatus: BadgeStatus = (() => {
    if (detailedGuidelines?.moderation?.moderationStatus === V2Beta1ModerationStatus.Rejected) {
      return 'Rejected';
    }
    return isUnrated ? 'NotStarted' : 'Assigned';
  })();

  const sortedRatingEntries = robloxProducts
    .flatMap((product) =>
      (product.iarcProduct?.ratingList ?? []).map((rating) => ({
        product,
        rating,
      })),
    )
    .sort((a, b) =>
      (a.rating.ratingAuthorityShortText ?? '').localeCompare(
        b.rating.ratingAuthorityShortText ?? '',
      ),
    );

  // UCS-2672: publishStatusListData can stay 'assigned' after a game loses its IARC rating.
  // Only show 'Assigned' when there are actual rating entries; preserve Pending/Rejected from parent.
  const iarcBadgeStatus: BadgeStatus =
    sortedRatingEntries.length > 0
      ? 'Assigned'
      : ratingsStatus === 'Assigned'
        ? 'NotStarted'
        : ratingsStatus;

  // UCS-2673: nonCompliantRegionStatus is derived from IARC publish status, which is empty for
  // games that only have a Roblox maturity label. Use actual restrictedCountries data instead.
  const restrictionsBadgeStatus: BadgeStatus =
    restrictedCountries.length > 0 ? 'Assigned' : nonCompliantRegionStatus;

  const isU18 = !isOverEighteenQuestionnaire;

  return (
    <div className='flex flex-col gap-medium'>
      {isU18 && sortedRatingEntries.length === 0 && (
        <ContextBanner
          description={translateWithNamespace(
            TranslationNamespace.DeveloperQuestionnaire,
            'Description.U18NoRatings',
          )}
        />
      )}
      <Accordion square variant='outlined' classes={{ root: accordionRoot }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          classes={{ content: accordionSummaryContent }}>
          <span className='text-heading-small'>{translate('Title.RobloxMaturityLabelV2')}</span>
          <Badge
            label={translate(`Label.${robloxMaturityStatus}`)}
            variant={getBadgeVariant(robloxMaturityStatus)}
          />
        </AccordionSummary>
        <AccordionDetails>
          <div className='flex flex-col gap-medium'>
            {/* <span className='text-body-medium content-default'>
              {translate('Description.RobloxMaturityLabel')}
            </span> */}
            <Table className={`${borderedTable} radius-medium clip`}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>{translate('Label.Rating')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>
                        {translate('TableHead.Descriptors')}
                      </span>
                    </div>
                  </TableCell>
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
                        .map((usage) => usage.experienceDescriptor?.displayName)
                        .filter(Boolean)
                        .map((name) => (
                          <span key={name} className='text-body-medium'>
                            {name}
                          </span>
                        ))}
                      {descriptorUsages.length === 0 && <span className='text-body-medium'>—</span>}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion square variant='outlined' classes={{ root: accordionRoot }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          classes={{ content: accordionSummaryContent }}>
          <span className='text-heading-small'>{translate('Title.MoreContentRatings')}</span>
          <Badge
            label={translate(`Label.${iarcBadgeStatus}`)}
            variant={getBadgeVariant(iarcBadgeStatus)}
          />
        </AccordionSummary>
        <AccordionDetails>
          <div className='flex flex-col gap-medium'>
            <span className='text-body-medium content-default'>
              {translate('Description.MoreContentRatings')}
            </span>
            {ratingsStatus === 'Pending' &&
              (isU18 ? (
                <ContextBanner
                  description={translateWithNamespace(
                    TranslationNamespace.DeveloperQuestionnaire,
                    'Description.U18PendingRatings',
                  )}
                />
              ) : (
                <FeedbackBanner
                  title=''
                  description={translate('Description.PendingRatingsAutoUpdate')}
                  layout='Inline'
                  variant='Standard'
                  severity='Info'
                />
              ))}
            <Table className={`${borderedTable} radius-medium clip`}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>{translate('Label.RatingSystem')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>{translate('Label.Rating')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>
                        {translate('Label.InteractiveElements')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>
                        {translate('Label.IARCDescriptors')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>
                        {translate('Label.RobloxDescriptors')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRatingEntries.length > 0 ? (
                  sortedRatingEntries.map(({ product, rating }) => (
                    <TableRow
                      key={`${product.productId ?? ''}-${rating.ratingAuthorityID ?? ''}-${rating.ageRatingID ?? ''}`}>
                      <TableCell>
                        <div className='flex flex-col gap-xsmall'>
                          <span className='text-body-medium'>
                            {rating.ratingAuthorityShortText ?? '—'}
                          </span>
                          {rating.localizedRegionText && (
                            <span className='text-body-small content-muted'>
                              {rating.localizedRegionText}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-small'>
                          {rating.ageRatingIconUrl && (
                            <img
                              src={rating.ageRatingIconUrl}
                              alt={rating.localizedDisplayText ?? ''}
                              className='height-[32px] width-[32px] radius-small'
                            />
                          )}
                          <span className='text-body-medium'>
                            {rating.localizedDisplayText ?? '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          {(rating.interactiveElementList ?? [])
                            .map((el) => el.localizedDisplayText ?? el.interactiveElementText)
                            .filter(Boolean)
                            .map((text) => (
                              <span key={text} className='text-body-medium'>
                                {text}
                              </span>
                            ))}
                          {!rating.interactiveElementList?.length && (
                            <span className='text-body-medium'>—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='text-body-medium'>
                          {rating.descriptorList
                            ?.map((d) => d.localizedDisplayText ?? d.descriptorText)
                            .join(', ') ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          {robloxDescriptors.map((name) => (
                            <span key={name} className='text-body-medium'>
                              {name}
                            </span>
                          ))}
                          {robloxDescriptors.length === 0 && (
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
            </Table>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion square variant='outlined' classes={{ root: accordionRoot }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          classes={{ content: accordionSummaryContent }}>
          <span className='text-heading-small'>{translate('Title.NonCompliantRegions')}</span>
          <Badge
            label={translate(`Label.${restrictionsBadgeStatus}`)}
            variant={getBadgeVariant(restrictionsBadgeStatus)}
          />
        </AccordionSummary>
        <AccordionDetails>
          <div className='flex flex-col gap-medium'>
            <span className='text-body-medium content-default'>
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
            </span>
            <Table className={`${borderedTable} radius-medium clip`}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>{translate('Title.Location')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>
                        {translate('TableHead.Descriptors')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-small'>
                      <span className='text-label-medium'>
                        {translate('Title.GuidelinesAgeRestriction')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {restrictedCountries.length > 0 ? (
                  restrictedCountries.map((country, index) => (
                    <TableRow key={country.countryCode ?? index}>
                      <TableCell>
                        <span className='text-body-medium'>
                          {country.countryDisplayName ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className='text-body-medium'>
                          {country.experienceDescriptorUsages
                            ?.map((d) => d.descriptorDisplayName)
                            .filter(Boolean)
                            .join(', ') ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className='text-body-medium'>
                          {country.experienceDescriptorUsages
                            ?.map((d) => d.ageRangeDisplayName)
                            .filter(Boolean)
                            .join(', ') ?? '—'}
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
            </Table>
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default RatingsContent;
