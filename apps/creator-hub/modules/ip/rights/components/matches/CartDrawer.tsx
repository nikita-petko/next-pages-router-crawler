import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  CloseIcon,
  Container,
  Drawer,
  Grid,
  IconButton,
  Typography,
  makeStyles,
} from '@rbx/ui';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type Match from './Match';
import SelectedContentsDisplay from './SelectedContentsDisplay';
import useEscapeKey, { ESCAPE_KEY_ESC } from './useEscapeKey';

// inspired by filter drawer styles
const useDrawerStyles = makeStyles()((theme) => {
  const verticalMargin = 16;
  const horizontalMargin = 22;
  const drawerContentHorizontalPadding = 40;
  const navBarHeight = 60; // match app top nav bar height
  const drawerWidth = 600;
  return {
    drawerSecondRow: {
      marginTop: '24px',
      padding: theme.spacing(0, '40px'),
    },
    drawerPaper: {
      margin: theme.spacing(
        `${navBarHeight + verticalMargin}px`,
        `${horizontalMargin}px`,
        `${verticalMargin}px`,
      ),
      height: `calc(100% - ${navBarHeight + 2 * verticalMargin}px)`,
      // max width cannot go beyond 100% - 2 * horizontal margin
      width: `min(calc(100% - ${2 * horizontalMargin}px), ${drawerWidth}px)`,
      border: 'unset',
      ...theme.border.radius.medium,
      boxShadow: theme.elevation.overlay,
    },
    drawerTitle: {
      marginTop: '32px',
      padding: theme.spacing(0, '40px'),
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    drawerContent: {
      display: 'block',
      flexGrow: 1,
      marginTop: '24px',
      padding: `0 ${drawerContentHorizontalPadding}px`,
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    drawerFooter: {
      display: 'flex',
      borderTop: `1px solid ${theme.palette.surface[400]}`,
      padding: theme.spacing('24px', '40px'),
    },
    drawer: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
    },
  };
});

const CartDrawer = ({
  open,
  onClose,
  onSubmit,
  cartItems,
  removeFromCart,
  clear,
  buttonText,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  cartItems: Match[];
  removeFromCart: (elem: Match) => void;
  clear: () => void;
  buttonText: string;
}) => {
  const { translate, ready } = useTranslation();
  const {
    classes: { drawerPaper, drawerTitle, drawer, drawerContent, drawerFooter, drawerSecondRow },
  } = useDrawerStyles();
  useEscapeKey(ESCAPE_KEY_ESC, onClose);
  if (!ready) {
    return null;
  }

  return (
    <Drawer
      anchor='right'
      variant='persistent'
      open={open}
      PaperProps={{
        className: drawerPaper,
      }}>
      <Container className={drawer}>
        <Grid container className={drawerTitle}>
          <Grid item>
            <Typography variant='h3'>{translate('Label.ViewSelectedItems')}</Typography>
          </Grid>
          <Grid item>
            <IconButton aria-label='Close' color='inherit' onClick={onClose} size='small'>
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Grid container className={drawerSecondRow}>
          <Grid
            item
            direction='row'
            sx={{
              display: 'flex',
              flex: '1',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Button variant='contained' color='secondary' onClick={clear} size='large'>
              {translate('Action.DeleteAll')}
            </Button>
            <div>
              <Typography variant='body1'>
                {translate(cartItems.length === 1 ? 'Label.ItemSelected' : 'Label.ItemsSelected', {
                  count: `${cartItems.length}`,
                })}
              </Typography>
            </div>
          </Grid>
        </Grid>
        <Grid className={drawerContent}>
          {cartItems.length === 0 ? (
            <Grid sx={{ height: '100%' }} justifyContent='center' alignContent='center'>
              <EmptyState
                title={translate('Heading.NoItemsSelected')}
                description={translate('Description.NoItemsSelected')}
                size='small'
              />
            </Grid>
          ) : (
            <SelectedContentsDisplay
              cartItems={cartItems}
              removeFromCart={removeFromCart}
              numPerRow={2}
            />
          )}
        </Grid>
        <Grid
          container
          item
          className={drawerFooter}
          spacing={2}
          sx={{ width: '100%' }}
          alignItems='stretch'
          direction={{
            xs: 'column-reverse',
            sm: 'row',
          }}>
          <Grid item XSmall={6}>
            <Button variant='outlined' color='secondary' onClick={onClose} fullWidth size='large'>
              {translate('Action.Close')}
            </Button>
          </Grid>
          <Grid item XSmall={6}>
            <Button
              variant='contained'
              color='primaryBrand'
              onClick={onSubmit}
              fullWidth
              size='large'
              disabled={cartItems.length === 0}>
              {`${buttonText} (${cartItems.length})`}
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Drawer>
  );
};

export default withTranslation(CartDrawer, [TranslationNamespace.RightsPortal]);
