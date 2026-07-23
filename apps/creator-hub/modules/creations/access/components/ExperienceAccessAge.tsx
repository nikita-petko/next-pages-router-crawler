import { Fragment } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { FormControlLabel, Grid, Link, Radio, RadioGroup, Typography } from '@rbx/ui';
import { ageRestrictionTypeTranslationKeys } from '../constants/AccessConstants';
import type { ExperienceAccessFormType } from '../ExperienceAccessTypes';
import { AgeRestrictionType } from '../ExperienceAccessTypes';
import useExperienceAccessFormStyles from './ExperienceAccessForm.styles';

type Props = {
  methods: UseFormReturn<ExperienceAccessFormType>;
  enableCreatorControlsAgeGate: boolean;
};

function ExperienceAccessAge({ methods, enableCreatorControlsAgeGate }: Props) {
  const {
    classes: { section, controls },
  } = useExperienceAccessFormStyles();
  const { translate, translateHTML } = useTranslation();
  const { control } = methods;

  return (
    <>
      {enableCreatorControlsAgeGate && (
        <Grid classes={{ root: section }}>
          <Typography variant='h2'>{translate('Heading.Age')}</Typography>
          <Typography variant='body2' color='secondary'>
            {translateHTML('Description.Age', [
              {
                opening: 'startLink',
                closing: 'endLink',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/publish-experiences-and-places#configure-experiences`}
                      target='_blank'
                      underline='always'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>

          <Grid item XSmall={12} classes={{ root: controls }}>
            <Controller
              name='minimumAge'
              control={control}
              render={({ field }) => (
                <RadioGroup
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}>
                  {Object.values(AgeRestrictionType).map((ageType) => (
                    <FormControlLabel
                      key={ageType}
                      value={ageType}
                      control={
                        <Radio
                          aria-label={translate(ageRestrictionTypeTranslationKeys[ageType], {
                            age: ageType,
                          })}
                        />
                      }
                      label={translate(ageRestrictionTypeTranslationKeys[ageType], {
                        age: ageType,
                      })}
                    />
                  ))}
                </RadioGroup>
              )}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default ExperienceAccessAge;
