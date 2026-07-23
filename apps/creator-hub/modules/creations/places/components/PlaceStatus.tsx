import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import {
  Avatar,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from '@rbx/ui';
import { useStudio } from '@modules/miscellaneous/hooks';
import EditInStudioActionMenuItem from '../../common/components/EditInStudioActionMenuItem';
import StatusCardContextMenu from '../../common/components/StatusCardContextMenu';
import useCurrentPlace from '../hooks/useCurrentPlace';

const PlaceStatus: FunctionComponent = () => {
  const { isPlaceLoading, placeDetails, canConfigurePlace, placeIcon } = useCurrentPlace();
  const router = useRouter();
  const { id, placeId } = router.query;
  const { open, dialog } = useStudio();

  return (
    <List disablePadding>
      {dialog}
      {canConfigurePlace && typeof placeDetails !== 'undefined' && placeDetails !== null ? (
        <ListItem disableGutters>
          <ListItemAvatar>
            <Avatar variant='rounded' alt='icon'>
              {placeIcon}
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={placeDetails.name} />
          <ListItemSecondaryAction>
            <StatusCardContextMenu
              menuItems={[
                <EditInStudioActionMenuItem
                  key='edit-in-studio'
                  universeId={id?.toString()}
                  placeId={placeId?.toString()}
                  openStudio={open}
                />,
              ]}
            />
          </ListItemSecondaryAction>
        </ListItem>
      ) : (
        isPlaceLoading && <CircularProgress color='secondary' />
      )}
    </List>
  );
};

export default PlaceStatus;
