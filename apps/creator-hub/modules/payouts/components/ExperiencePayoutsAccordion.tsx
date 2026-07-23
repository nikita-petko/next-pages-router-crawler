import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  makeStyles,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Link,
  Skeleton,
  CircularProgress,
  useMediaQuery,
  InfoOutlinedIcon,
  Tooltip,
} from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { UniverseModel } from '@rbx/clients/universesApi';
import { HydratedListAgreementResponse } from '@rbx/clients/contentLicensingApi/v1';
import { www } from '@modules/miscellaneous/common/urls';
import { Organization, UpdateUniversePayoutsRequest } from '@modules/clients/organizationApi';
import { organizationApiClient } from '@modules/clients';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
// eslint-disable-next-line no-restricted-imports -- events
import { logOrganizationsEvent, OrganizationsEventName } from '@modules/group/utils/eventUtils';
import PayoutsDetails from './PayoutsDetails';
import { PayoutsBase } from '../interface/PayoutsFormType';
import PayoutType from '../interface/PayoutType';
import { licensedExperienceHelpUrl } from '../constants/payoutsConstants';

const useGroupPayoutsStyles = makeStyles()((theme) => ({
  accordion: {
    width: '100%',
  },

  accordionSummary: {
    '& > div:first-child': {
      width: '100%',
    },
  },

  accordionSummaryInner: {
    '& > *:not(:last-child)': {
      marginRight: 12,
    },
  },

  accordionDetails: {
    padding: '8px 40px 32px 40px',
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },

  accordionTitle: {
    whiteSpace: 'nowrap',
    '& > *:not(:last-child)': {
      paddingBottom: 4,
    },
  },

  universeThumbnail: {
    width: 32,
    minWidth: 32,
    height: 32,
    marginRight: 8,
  },

  universeThumbnailImg: {
    borderRadius: 4,
  },

  mutedText: {
    color: theme.palette.content.muted,
  },

  payoutOverview: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'nowrap',
      textWrap: 'nowrap',
    },
    '& > *:not(:last-child)': {
      marginRight: 24,
    },
  },
}));

export type ExperiencePayoutsAccordionProps = {
  organization: Organization;
  universe: UniverseModel;
  disabled?: boolean;
  agreement?: HydratedListAgreementResponse;
};

const ExperiencePayoutsAccordion: FunctionComponent<ExperiencePayoutsAccordionProps> = ({
  organization,
  universe,
  agreement,
  disabled = false,
}) => {
  const {
    classes: {
      accordion,
      accordionSummary,
      accordionSummaryInner,
      accordionDetails,
      accordionTitle,
      universeThumbnail,
      universeThumbnailImg,
      mutedText,
      payoutOverview,
    },
  } = useGroupPayoutsStyles();

  const { translate, translateHTML } = useTranslation();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const [universePayouts, setUniversePayouts] = useState<PayoutsBase[]>();
  const [groupPayoutPercentage, setGroupPayoutPercentage] = useState<number>();

  const calculateGroupPayoutPercentage = useCallback((payouts: PayoutsBase[]) => {
    const nonGroupPayoutPercentages = payouts.map((payout) =>
      Number.parseInt(payout.percentage, 10),
    );
    const nonGroupPayoutSum =
      nonGroupPayoutPercentages.length === 0
        ? 0
        : nonGroupPayoutPercentages.reduce((sum, curr) => sum + curr);

    setGroupPayoutPercentage(100 - nonGroupPayoutSum);
  }, []);

  const fetchData = useCallback(async () => {
    if (!universe.id) {
      return;
    }

    const universePayoutsResponse =
      await organizationApiClient.groupUniversePayoutClient.getUniversePayouts({
        organizationId: organization.id,
        universeId: universe.id.toString(),
      });

    const payouts: PayoutsBase[] = universePayoutsResponse.payouts.map((payout) => {
      return {
        creatorId: payout.userId,
        percentage: payout.percentage,
      };
    });

    setUniversePayouts(payouts);
    calculateGroupPayoutPercentage(payouts);
  }, [calculateGroupPayoutPercentage, organization.id, universe.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSave = useCallback(
    async (payouts: PayoutsBase[]) => {
      if (!universe.id) {
        return { updateSucceeded: false };
      }

      try {
        const filteredPayouts = payouts.filter((payout) =>
          Number.isInteger(Number.parseInt(payout.percentage, 10)),
        );

        const recurringPayouts = filteredPayouts.map((payout) => {
          return {
            userId: payout.creatorId,
            percentage: payout.percentage,
          };
        });

        const request: UpdateUniversePayoutsRequest = {
          organizationId: organization.id,
          universeId: universe.id.toString(),
          updateUniverseRecurringPayoutsRequestModel: {
            payouts: recurringPayouts,
          },
        };

        const response =
          await organizationApiClient.groupUniversePayoutClient.updateUniversePayouts(request);

        const updatedPayouts: PayoutsBase[] = response.payouts.map((payout) => {
          return {
            creatorId: payout.userId,
            percentage: payout.percentage,
          };
        });

        const nonZeroUpdatedPayouts = updatedPayouts.filter(
          (payout) => Number.parseInt(payout.percentage, 10) > 0,
        );

        setUniversePayouts(nonZeroUpdatedPayouts);
        calculateGroupPayoutPercentage(payouts);

        logOrganizationsEvent(
          unifiedLogger,
          OrganizationsEventName.ClickOrgsConfirmRecurringPayout,
          {
            group_id: organization?.groupId ?? '',
            type: PayoutType.Experiences,
            experience_id: universe.id.toString(),
            payouts: JSON.stringify(payouts),
          },
        );

        return { updateSucceeded: true };
      } catch {
        return { updateSucceeded: false }; // Error will be shown in ConfigurePayoutsForm
      }
    },
    [
      universe.id,
      organization.id,
      calculateGroupPayoutPercentage,
      organization?.groupId,
      unifiedLogger,
    ],
  );

  return (
    <Accordion variant='filled' className={accordion}>
      <AccordionSummary className={accordionSummary}>
        <Grid
          container
          direction='row'
          flexWrap='nowrap'
          justifyContent='space-between'
          alignItems='center'
          className={accordionSummaryInner}>
          <Grid container alignItems='center' wrap='nowrap'>
            <Grid container className={universeThumbnail} data-testid='thumbnail'>
              <Thumbnail2d
                targetId={universe.id ?? 0}
                type={ThumbnailTypes.gameIcon}
                imgClassName={universeThumbnailImg}
                alt='thumbnail'
                returnPolicy={ReturnPolicy.PlaceHolder}
                includeBackground={false}
              />
            </Grid>

            <Grid container direction='column'>
              <Grid item container alignItems='center'>
                <Typography variant='body1' color='inherit'>
                  {universe.name}
                </Typography>
                {agreement && (
                  <React.Fragment>
                    <Typography
                      variant='footer'
                      color='inherit'
                      paddingLeft='6px'
                      paddingRight='6px'>
                      •
                    </Typography>
                    <Link
                      href={licensedExperienceHelpUrl}
                      onClick={(e) => {
                        // Prevent the accordion from opening/closing when the link is clicked
                        e.stopPropagation();
                      }}
                      target='_blank'
                      color='inherit'>
                      <Typography variant='footer' color='inherit' paddingRight='6px'>
                        {translate('Label.Licensed')}
                      </Typography>
                    </Link>
                    <Tooltip
                      arrow
                      placement='top'
                      title={translateHTML('Description.LicensedExperienceTooltip', [
                        {
                          opening: 'LearnMoreLinkStart',
                          closing: 'LearnMoreLinkEnd',
                          content(chunks) {
                            return (
                              <Link
                                onClick={(e) => {
                                  // Prevent the accordion from opening/closing when the link is clicked
                                  e.stopPropagation();
                                }}
                                color='inherit'
                                underline='always'
                                href={licensedExperienceHelpUrl}
                                target='_blank'>
                                {chunks}
                              </Link>
                            );
                          },
                        },
                      ])}>
                      <InfoOutlinedIcon color='secondary' fontSize='small' />
                    </Tooltip>
                  </React.Fragment>
                )}
              </Grid>
              <Grid item>
                <Link
                  href={universe.rootPlaceId ? www.getGameDetailsUrl(universe.rootPlaceId) : ''}
                  className={accordionTitle}
                  color='inherit'>
                  <Typography variant='body2' className={mutedText}>
                    {universe.id}
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Grid>
          {!isMobile && (
            <Grid item className={payoutOverview}>
              <Grid item>
                <Typography variant='captionHeader' className={mutedText}>
                  {translate('Title.GroupEarnings')}
                </Typography>

                {groupPayoutPercentage !== undefined ? (
                  <Typography variant='captionBody' className={mutedText}>
                    {`${groupPayoutPercentage}%`}
                  </Typography>
                ) : (
                  <Skeleton animate variant='text' width={100} height={20} />
                )}
              </Grid>

              <Grid item className={payoutOverview}>
                <Typography variant='captionHeader' className={mutedText}>
                  {translate('Title.Splits')}
                </Typography>

                {universePayouts ? (
                  <Typography
                    variant='captionBody'
                    className={mutedText}
                    data-testid={`splits-${universePayouts.length}`}>
                    {universePayouts.length +
                      (groupPayoutPercentage && groupPayoutPercentage > 0 ? 1 : 0)}
                  </Typography>
                ) : (
                  <Skeleton animate variant='text' width={100} height={20} />
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </AccordionSummary>

      <AccordionDetails className={accordionDetails}>
        {universePayouts ? (
          <PayoutsDetails
            organization={organization}
            payouts={universePayouts}
            onSave={onSave}
            payoutType={PayoutType.Experiences}
            disabled={disabled}
          />
        ) : (
          <Grid container justifyContent='center'>
            <CircularProgress color='secondary' />
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ExperiencePayoutsAccordion;
