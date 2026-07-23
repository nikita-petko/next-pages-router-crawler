import { FunctionComponent, useState, useCallback, useEffect } from 'react';
import {
  Grid,
  Typography,
  Button,
  OpenInNewIcon,
  CheckCircleOutlineIcon,
  Checkbox,
  FormControlLabel,
} from '@rbx/ui';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import { AgreementResolutionResponse, userAgreementsClient } from '@modules/clients';
import { ClientType } from '@rbx/clients/userAgreementsService/v1';
import { resolveUrl } from '@rbx/env-utils';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useTopMessage from '../../../utils/useTopMessage';
import {
  eligibilityToTranslationKeys,
  EligibilityRequirementResult,
  EligibilityRequirement,
} from '../../types';
import useEligibilityFormStyles from './EligibilityForm.styles';

export type TEligibilityFormProps = {
  eligibilityRequirements: EligibilityRequirementResult[];
};

const EligibilityForm: FunctionComponent<TEligibilityFormProps> = ({ eligibilityRequirements }) => {
  // We define the item that we created for EligibilityToTranslationKey in the types file.
  type EligibilityItem = {
    title: string;
    description: string;
    generic: boolean;
    link?: string;
    button?: string;
  };

  const {
    classes: {
      prereqTitle,
      titleDescription,
      eligibilityDescription,
      eligibilityIcon,
      legalDescription,
      terms,
      submitTermsButton,
    },
  } = useEligibilityFormStyles();

  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { showSuccessMessage, showFailureMessage } = useTopMessage();
  const [termChecked, setTermChecked] = useState<boolean>(false);
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false);

  const [updateAgreements, setUpdateAgreements] = useState<AgreementResolutionResponse[]>([]);
  const handleConfirm = useCallback(async () => {
    try {
      const agreementIdsNeedsUpdate = updateAgreements.map((agreements) => agreements.id);
      await userAgreementsClient.acceptUserAgreements(agreementIdsNeedsUpdate);
      showSuccessMessage('Agreement successfully accepted.');
      setTermChecked(true);
      setAgreementChecked(true);
    } catch {
      showFailureMessage('Agreement submission failed, please try again.');
    }
  }, [showFailureMessage, showSuccessMessage, updateAgreements]);

  const fetchUpdateUserAgreements = useCallback(async () => {
    try {
      const response = await userAgreementsClient.getUserAgreements({
        clientType: ClientType.ExtendedServices,
      });

      if (response.length > 0) {
        setUpdateAgreements(response);
      } else {
        setTermChecked(true);
        setAgreementChecked(true);
      }
    } catch {
      setTermChecked(false);
      setAgreementChecked(false);
    }
  }, []);

  // Simplify the backend response into a map of eligibility requirements
  const eligibilityMap = eligibilityRequirements.reduce(
    (acc, curr) => {
      if (curr.eligibilityRequirement) {
        acc[curr.eligibilityRequirement as EligibilityRequirement] = curr.eligible;
      }
      return acc;
    },
    {} as Record<EligibilityRequirement, boolean | undefined>,
  );

  // Combined check for ID Verification and Age
  const isIdAndAgeEligible = () => {
    const idVerified = eligibilityMap[EligibilityRequirement.IdVerified];
    const ageVerified = eligibilityMap[EligibilityRequirement.Age];
    return idVerified !== false && ageVerified !== false;
  };

  // We will be mapping the EligibilityToTranslationKey object into a useable object and compare it against the backend call
  // The requirement list will be mapped into two objects, one for generic requirements and one for non generic requirements (for service level)
  const genericRequirements: { key: EligibilityRequirement; item: EligibilityItem }[] =
    Object.entries(eligibilityToTranslationKeys)
      .filter(
        ([key, item]) =>
          item.generic === true &&
          key !== EligibilityRequirement.Age &&
          key !== EligibilityRequirement.IdVerified,
      )
      .map(([key, item]) => ({ key: key as EligibilityRequirement, item }));

  // To display warning or success on the check icon
  const isRequirementMet = (requirement: EligibilityRequirement) => {
    // We are combining the ID verification and age checks.
    if (requirement === EligibilityRequirement.IdVerified) {
      return isIdAndAgeEligible();
    }
    const eligible = eligibilityMap[requirement];
    return eligible !== false;
  };

  useEffect(() => {
    fetchUpdateUserAgreements();
  }, [fetchUpdateUserAgreements]);

  return (
    <Grid container item XSmall={12} spacing={6}>
      <Grid item container XSmall={12}>
        <HubMeta
          hubOnly
          title={buildTitle(
            translate(translationKey('Title.ExtendedServices', TranslationNamespace.CloudServices)),
          )}
        />
      </Grid>
      <Grid item container XSmall={12} className={titleDescription}>
        <Typography variant='caption' component='p'>
          {translate(
            translationKey(
              'Description.ServiceEfficiencyEligibility',
              TranslationNamespace.CloudServices,
            ),
          )}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='h5' component='p' className={prereqTitle}>
          {translate(translationKey('Label.Prerequisites', TranslationNamespace.CloudServices))}
        </Typography>
      </Grid>
      <Grid
        container
        item
        XSmall={12}
        alignItems='center'
        justifyContent='space-between'
        key={EligibilityRequirement.IdVerified}>
        <Grid item className={eligibilityIcon}>
          <Grid item>
            <CheckCircleOutlineIcon
              fontSize='large'
              data-testid='id-verification-icon'
              color={isRequirementMet(EligibilityRequirement.IdVerified) ? 'success' : 'disabled'}
            />
          </Grid>
          <Grid item>
            <Typography variant='h6' component='p' className={eligibilityDescription}>
              {translate(
                translationKey(
                  eligibilityToTranslationKeys[EligibilityRequirement.IdVerified].title,
                  TranslationNamespace.CloudServices,
                ),
              )}
            </Typography>
            <Typography
              variant='caption'
              component='p'
              color='secondary'
              className={eligibilityDescription}>
              {translate(
                translationKey(
                  eligibilityToTranslationKeys[EligibilityRequirement.IdVerified].description,
                  TranslationNamespace.CloudServices,
                ),
              )}
            </Typography>
          </Grid>
        </Grid>
        {!isRequirementMet(EligibilityRequirement.IdVerified) &&
          eligibilityToTranslationKeys[EligibilityRequirement.IdVerified].link &&
          eligibilityToTranslationKeys[EligibilityRequirement.IdVerified].button && (
            <Grid item>
              <Button
                data-testid='id-verification-button'
                color='primaryBrand'
                size='small'
                href={eligibilityToTranslationKeys[EligibilityRequirement.IdVerified].link}>
                {translate(
                  translationKey(
                    eligibilityToTranslationKeys[EligibilityRequirement.IdVerified].button,
                    TranslationNamespace.CloudServices,
                  ),
                )}
                <OpenInNewIcon className={eligibilityIcon} />
              </Button>
            </Grid>
          )}
      </Grid>
      {genericRequirements.map(({ key, item: { title, description, link, button } }) => (
        <Grid
          container
          item
          XSmall={12}
          alignItems='center'
          justifyContent='space-between'
          key={key}>
          <Grid item className={eligibilityIcon}>
            <Grid item>
              <CheckCircleOutlineIcon
                fontSize='large'
                data-testid={`${key}-icon`}
                color={isRequirementMet(key) ? 'success' : 'disabled'}
              />
            </Grid>
            <Grid item>
              <Typography variant='h6' component='p' className={eligibilityDescription}>
                {translate(translationKey(title, TranslationNamespace.CloudServices))}
              </Typography>
              <Typography
                variant='caption'
                component='p'
                color='secondary'
                className={eligibilityDescription}>
                {translate(translationKey(description, TranslationNamespace.CloudServices))}
              </Typography>
            </Grid>
          </Grid>
          {!isRequirementMet(key) && link && button && (
            <Grid item>
              <Button data-testid={`${key}-button`} color='primaryBrand' size='small' href={link}>
                {translate(translationKey(button, TranslationNamespace.CloudServices))}
                <OpenInNewIcon className={eligibilityIcon} />
              </Button>
            </Grid>
          )}
        </Grid>
      ))}
      <Grid item>
        <Typography variant='h5' component='p' className={prereqTitle}>
          {translate(translationKey('Label.LegalAgreements', TranslationNamespace.CloudServices))}
        </Typography>
      </Grid>
      <Grid item container XSmall={12} className={legalDescription}>
        <Typography variant='caption' component='p'>
          {translate(
            translationKey('Description.LegalAgreements', TranslationNamespace.CloudServices),
          )}
        </Typography>
      </Grid>
      <Grid item XSmall={12} className={terms}>
        <FormControlLabel
          control={
            <Checkbox
              checked={termChecked}
              color='primary'
              size='medium'
              disabled={agreementChecked}
              onChange={() => setTermChecked(!termChecked)}
            />
          }
          label={translateHTML(
            translationKey(
              'Description.PlatformTermsOfService',
              TranslationNamespace.CloudServices,
            ),
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                // eslint-disable-next-line react/no-unstable-nested-components -- need to add link here
                content(chunks) {
                  return (
                    <CreatorDashboardLink
                      href={resolveUrl(
                        'extendedServicesTermsOfUseUrl',
                        process.env.targetEnvironment,
                        process.env.buildTarget,
                      )}
                      target='_blank'
                      underline='hover'>
                      {chunks}
                    </CreatorDashboardLink>
                  );
                },
              },
            ],
          )}
        />
      </Grid>
      <Grid item XSmall={12}>
        <Button
          disabled={!termChecked || agreementChecked}
          variant='contained'
          color='primaryBrand'
          onClick={() => handleConfirm()}
          className={submitTermsButton}>
          {translate(translationKey('Label.Submit', TranslationNamespace.CloudServices))}
        </Button>
      </Grid>
    </Grid>
  );
};

export default withTranslation(EligibilityForm, [TranslationNamespace.CloudServices]);
