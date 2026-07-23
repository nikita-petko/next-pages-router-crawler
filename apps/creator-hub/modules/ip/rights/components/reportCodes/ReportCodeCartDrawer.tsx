import {
  Button,
  CancelIcon,
  Card,
  CloseIcon,
  Container,
  Drawer,
  Grid,
  IconButton,
  Link as UILink,
  Typography,
  useTheme,
} from '@rbx/ui';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { EmptyState } from '@modules/miscellaneous/common/components';
import type { SnapshotContent } from '@rbx/clients/rightsV1';
import useCreatorInfo from '../../hooks/useCreatorInfo';
import useEscapeKey, { ESCAPE_KEY_ESC } from '../matches/useEscapeKey';
import { getSnapshotContentKey } from './ReportCodeContainer';
import SnapshotMediaPreview from './SnapshotMediaPreview';

const MAX_TILE_WIDTH = 25; // rem - match SelectedContentsDisplay

const textEllipsisSx = {
  display: 'block',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
} as const;

function ReportCodeSelectedItemTile({
  item,
  removeFromCart,
}: {
  item: SnapshotContent;
  removeFromCart: (item: SnapshotContent) => void;
}) {
  const { translate, ready } = useTranslation();
  const { name: creatorName, url: creatorUrl } = useCreatorInfo(
    item.creatorType ?? '',
    item.creatorId ?? '',
  );

  if (!ready) {
    return <PageLoading />;
  }

  return (
    <Grid item container spacing={1} sx={{ maxWidth: `${MAX_TILE_WIDTH}rem` }}>
      <Grid item XSmall='auto'>
        <Card sx={{ width: '50px' }}>
          <SnapshotMediaPreview
            contentUri={item.contentUri}
            assetType={item.assetType}
            contentId={item.contentId}
            variant='mini'
            style={{ width: 50, height: 50 }}
          />
        </Card>
      </Grid>
      <Grid item container XSmall direction='column' sx={{ flexBasis: 0, overflow: 'hidden' }}>
        <Grid item>
          <Typography sx={textEllipsisSx} variant='body1'>
            {item.name}
          </Typography>
        </Grid>
        {creatorName && (
          <Grid item>
            <Link href={creatorUrl} passHref legacyBehavior>
              <UILink
                sx={textEllipsisSx}
                variant='body2'
                color='inherit'
                target='_blank'
                onClick={(event) => event.stopPropagation()}>
                @{creatorName}
              </UILink>
            </Link>
          </Grid>
        )}
      </Grid>
      <Grid container item XSmall='auto'>
        <IconButton
          aria-label={translate('Action.DeleteContent')}
          color='secondary'
          onClick={() => removeFromCart(item)}>
          <CancelIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}

function ReportCodeCartItemsList({
  cartItems,
  removeFromCart,
}: {
  cartItems: SnapshotContent[];
  removeFromCart: (item: SnapshotContent) => void;
}) {
  const numPerRow = 2;
  const cartNodes = cartItems.map((item) => (
    <Grid item XSmall={1} Large={1} key={getSnapshotContentKey(item)}>
      <ReportCodeSelectedItemTile item={item} removeFromCart={removeFromCart} />
    </Grid>
  ));
  return (
    <div style={{ maxWidth: `${numPerRow * MAX_TILE_WIDTH}rem` }}>
      <Grid
        container
        columnSpacing={6}
        rowSpacing={3}
        columns={{ xs: 1, md: Math.ceil((numPerRow * 2) / 3), lg: numPerRow }}>
        {cartNodes}
      </Grid>
    </div>
  );
}

const VERTICAL_MARGIN = 16;
const HORIZONTAL_MARGIN = 22;
const DRAWER_CONTENT_HORIZONTAL_PADDING = 40;
const NAV_BAR_HEIGHT = 60;
const DRAWER_WIDTH = 600;

export interface ReportCodeCartDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  cartItems: SnapshotContent[];
  removeFromCart: (item: SnapshotContent) => void;
  clear: () => void;
  buttonText: string;
}

const ReportCodeCartDrawer = ({
  open,
  onClose,
  onSubmit,
  cartItems,
  removeFromCart,
  clear,
  buttonText,
}: ReportCodeCartDrawerProps) => {
  const { translate, ready } = useTranslation();
  const theme = useTheme();
  useEscapeKey(ESCAPE_KEY_ESC, onClose);

  const drawerPaperStyle = useMemo(
    () => ({
      margin: theme.spacing(
        `${NAV_BAR_HEIGHT + VERTICAL_MARGIN}px`,
        `${HORIZONTAL_MARGIN}px`,
        `${VERTICAL_MARGIN}px`,
      ),
      height: `calc(100% - ${NAV_BAR_HEIGHT + 2 * VERTICAL_MARGIN}px)`,
      width: `min(calc(100% - ${2 * HORIZONTAL_MARGIN}px), ${DRAWER_WIDTH}px)`,
      border: 'unset',
      ...theme.border.radius.medium,
      boxShadow: theme.elevation.overlay,
    }),
    [theme],
  );

  if (!ready) {
    return null;
  }

  return (
    <Drawer
      anchor='right'
      variant='persistent'
      open={open}
      PaperProps={{ style: drawerPaperStyle }}>
      <Container sx={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <Grid
          container
          sx={{
            marginTop: '32px',
            padding: theme.spacing(0, '40px'),
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Grid item>
            <Typography variant='h3'>{translate('Label.ViewSelectedItems')}</Typography>
          </Grid>
          <Grid item>
            <IconButton
              aria-label={translate('Action.Close')}
              color='inherit'
              onClick={onClose}
              size='small'>
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Grid container sx={{ marginTop: '24px', padding: theme.spacing(0, '40px') }}>
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
        <Grid
          sx={{
            display: 'block',
            flexGrow: 1,
            marginTop: '24px',
            padding: `0 ${DRAWER_CONTENT_HORIZONTAL_PADDING}px`,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>
          {cartItems.length === 0 ? (
            <Grid sx={{ height: '100%' }} justifyContent='center' alignContent='center'>
              <EmptyState
                title={translate('Heading.NoItemsSelected')}
                description={translate('Description.NoItemsSelected')}
                size='small'
              />
            </Grid>
          ) : (
            <ReportCodeCartItemsList cartItems={cartItems} removeFromCart={removeFromCart} />
          )}
        </Grid>
        <Grid
          container
          item
          spacing={2}
          sx={{
            display: 'flex',
            borderTop: `1px solid ${theme.palette.surface[400]}`,
            padding: theme.spacing('24px', '40px'),
            width: '100%',
          }}
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

export default withTranslation(ReportCodeCartDrawer, [TranslationNamespace.RightsPortal]);
