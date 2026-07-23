import type { FunctionComponent, ReactNode } from 'react';
import { Grid, Link, makeStyles, Typography } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

const useStyles = makeStyles()((theme) => ({
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  linkStyle: {
    color: theme.palette.content.standard,
    textDecoration: 'underline',
  },
  mainContainer: {
    marginTop: 4,
  },
  titleOnly: {
    marginTop: 4,
    paddingBottom: 20,
  },
}));

type OnboardingTipsCarouselContentProps = {
  titleKey: TranslationKey;
  contentKey?: TranslationKey;
  contentLink?: string;
};

const OnboardingTipsCarouselContent: FunctionComponent<OnboardingTipsCarouselContentProps> = ({
  titleKey,
  contentKey,
  contentLink,
}) => {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const {
    classes: { contentContainer, linkStyle, mainContainer, titleOnly },
  } = useStyles();

  return (
    <Grid item>
      <Typography
        component='div'
        variant='h6'
        classes={{ root: contentKey != null ? mainContainer : titleOnly }}>
        {translate(titleKey)}
      </Typography>
      {contentKey != null && (
        <Typography component='div' variant='body2' classes={{ root: contentContainer }}>
          {translateHTML(contentKey, [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks: ReactNode) {
                return (
                  <Link href={contentLink} target='_blank' classes={{ root: linkStyle }}>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
      )}
    </Grid>
  );
};

export default OnboardingTipsCarouselContent;
