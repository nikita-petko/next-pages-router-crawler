import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CheckCircleIcon,
  Grid,
  makeStyles,
  Typography,
} from '@rbx/ui';
import type { MerchantDetail } from '@modules/commerce/configs/merchantConfigs';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface CommerceMerchantCardProps {
  merchantDetail: MerchantDetail;
  selected: boolean;
  onClick: () => void;
}

const useStyles = makeStyles()((theme) => ({
  root: {
    position: 'relative',
  },
  // TODO(SUBS-3128): replace with TitleSelectorGroup if possible; attempting workarounds based on its styles
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.components.mediaButtons.outlined.enabledBorder,
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    outlineOffset: 2,
    WebkitMaskImage: 'none',
    '&:hover': {
      borderColor: theme.palette.components.mediaButtons.outlined.hoverBorder,
    },
  },
  cardSelected: {
    borderColor: 'transparent',
    outlineColor: theme.palette.actionV2.primaryBrand.fill,
    '&:hover': {
      borderColor: 'transparent',
    },
  },
  cardMedia: {
    height: 180,
  },
  cardMediaContainer: {
    background: theme.palette.content.static.light,
    height: '100%',
    width: '100%',
  },
  cardContent: {
    minHeight: 112,
    background: theme.palette.surface[400],
  },
  icon: {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: `${theme.transitions.duration.shortest}ms`,
    transitionTimingFunction: theme.transitions.easing.easeInOut,
  },
  iconSelected: {
    opacity: 1,
  },
}));

const CommerceSelectMerchantCard = ({
  merchantDetail,
  selected,
  onClick,
}: CommerceMerchantCardProps) => {
  const { translate } = useTranslation();
  const { classes, cx } = useStyles();

  return (
    <div className={classes.root}>
      <Card className={cx(classes.card, { [classes.cardSelected]: selected })}>
        <CardActionArea onClick={onClick}>
          <CardMedia title={merchantDetail.displayName} className={classes.cardMedia}>
            <Grid
              container
              className={classes.cardMediaContainer}
              alignItems='center'
              justifyContent='center'>
              <img
                src={merchantDetail.imageConfigs.wordmarkLogo.path}
                alt={merchantDetail.displayName}
                width={merchantDetail.imageConfigs.wordmarkLogo.scale * 180}
              />
            </Grid>
          </CardMedia>
          <CardContent className={classes.cardContent}>
            <Typography variant='h5' color='primary' component='p' marginBottom={1}>
              {merchantDetail.displayName}
            </Typography>
            <Typography variant='body2' color='primary'>
              {translate(merchantDetail.translationKeys.selectMerchantDescription)}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
      <CheckCircleIcon
        color='primary'
        className={cx(classes.icon, { [classes.iconSelected]: selected })}
      />
    </div>
  );
};

export default withTranslation(CommerceSelectMerchantCard, [TranslationNamespace.Commerce]);
