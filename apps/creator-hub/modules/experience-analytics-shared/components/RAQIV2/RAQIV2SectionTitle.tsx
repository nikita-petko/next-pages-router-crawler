import type { FunctionComponent } from 'react';
import React from 'react';
import { InfoOutlinedIcon, makeStyles, Tooltip, Typography, Grid } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type { RAQIV2SectionTitleLayoutConfig } from '../../types/RAQIV2SpecialLayoutConfig';
import OnboardingTipsCarousel from '../OnboardingTips/OnboardingTipsCarousel';

const useStyles = makeStyles()(() => ({
  tooltipIconPadding: {
    paddingLeft: '6px',
    lineHeight: '10px',
    verticalAlign: 'middle',
    display: 'inline-block',
  },
  sectionTitle: {
    zIndex: 1,
    marginTop: 16,
  },
  descriptionContainer: {
    paddingTop: 8,
  },
}));

const RAQIV2SectionTitle: FunctionComponent<Omit<RAQIV2SectionTitleLayoutConfig, 'type'>> = ({
  titleKey,
  tooltipKey,
  description,
  onboardingTipsConfig,
}) => {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const {
    classes: { tooltipIconPadding, sectionTitle, descriptionContainer },
  } = useStyles();

  return (
    <Grid item XSmall={12}>
      <Typography
        component='div'
        variant='h2'
        classes={{
          root: sectionTitle,
        }}>
        {translate(titleKey)}
        {tooltipKey && (
          <Tooltip
            title={translate(tooltipKey)}
            placement='top'
            enterTouchDelay={0}
            leaveTouchDelay={3000}>
            <div className={tooltipIconPadding}>
              <InfoOutlinedIcon fontSize='small' />
            </div>
          </Tooltip>
        )}
        {onboardingTipsConfig && (
          <OnboardingTipsCarousel
            featureKey={onboardingTipsConfig.featureKey}
            stepKey={onboardingTipsConfig.stepKey}
          />
        )}
      </Typography>
      {description && description.length > 0 && (
        <Typography variant='body1' component='div' classes={{ root: descriptionContainer }}>
          {description.map((desc, index) => (
            <span key={`${desc.key.namespace ?? ''}:${desc.key.key}`}>
              {index > 0 && <br />}
              {translateHTML(
                desc.key,
                [
                  {
                    opening: 'linkStart',
                    closing: 'linkEnd',
                    content(chunks) {
                      if (!desc.link) {
                        return chunks;
                      }
                      return (
                        <Link href={desc.link} target='_blank' underline='always' color='inherit'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                ],
                { linkBreak: <br />, ...desc.args },
              )}
            </span>
          ))}
        </Typography>
      )}
    </Grid>
  );
};

export default React.memo(RAQIV2SectionTitle);
