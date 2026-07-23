import type { CSSProperties, FC, FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// TODO: Replace with `@rbx/ui` or `@rbx/foundation-ui` import — `createFilterOptions` is not yet exported from either
import { createFilterOptions } from '@mui/material/Autocomplete';
import { useTranslation } from '@rbx/intl';
import {
  Autocomplete,
  CircularProgress,
  CloseIcon,
  DragHandleIcon,
  IconButton,
  TextField,
  Typography,
} from '@rbx/ui';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import type { SongArtist } from './useGetFriendsAsSongArtists';
import useGetFriendsAsSongArtists from './useGetFriendsAsSongArtists';

export type SongArtistsSectionProps = {
  artists: SongArtist[];
  onArtistsChange: (artists: SongArtist[]) => void;
};

type SortableArtistChipProps = {
  artist: SongArtist;
  onDelete: (event: React.SyntheticEvent) => void;
};

const getArtistLabel = (artist: SongArtist) => artist.displayName ?? artist.username;

const SortableArtistChip: FC<SortableArtistChipProps> = ({ artist, onDelete }) => {
  const { translate } = useTranslation();
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: artist.userId,
  });
  const artistLabel = getArtistLabel(artist);

  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className='flex items-center width-full padding-y-xsmall'>
      <div className='flex items-center cursor-pointer' {...attributes} {...listeners}>
        <DragHandleIcon style={{ fontSize: 18 }} color='disabled' />
      </div>
      <div className='grow-1 margin-left-small'>
        <ThumbnailWithNames
          target={{ id: artist.userId, name: artist.username, displayName: artistLabel }}
          disableLink
          variant='compact'
          targetType={CreatorType.User}
        />
      </div>
      <IconButton
        size='small'
        aria-label={translate('Action.RemoveArtist', { username: artist.username })}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e);
        }}>
        <CloseIcon style={{ fontSize: 14 }} />
      </IconButton>
    </div>
  );
};

const autocompleteFilterOptions = createFilterOptions<SongArtist>({
  stringify: (option) => [option.username, option.displayName].filter(Boolean).join(' '),
});

const getOptionLabel = (option: SongArtist) => getArtistLabel(option);

const isOptionEqualToValue = (option: SongArtist, value: SongArtist) =>
  option.userId === value.userId;

const SongArtistsSection: FunctionComponent<SongArtistsSectionProps> = ({
  artists,
  onArtistsChange,
}) => {
  const { translate } = useTranslation();

  const { data: friends, isLoading, isError } = useGetFriendsAsSongArtists();
  const [isOpen, setIsOpen] = useState(false);

  const availableFriends = friends.filter(
    (friend) => !artists.some((artist) => artist.userId === friend.userId),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (over && active.id !== over.id) {
        const oldIndex = artists.findIndex((a) => a.userId === active.id);
        const newIndex = artists.findIndex((a) => a.userId === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          onArtistsChange(arrayMove(artists, oldIndex, newIndex));
        }
      }
    },
    [artists, onArtistsChange],
  );

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: SongArtist[]) => {
      onArtistsChange(newValue);
      if (newValue.length >= friends.length) {
        setIsOpen(false);
      }
    },
    [onArtistsChange, friends.length],
  );

  if (isLoading) {
    return <CircularProgress size={20} />;
  }

  if (isError) {
    return (
      <Typography variant='body2' color='error'>
        {translate('Message.PleaseTryAgain')}
      </Typography>
    );
  }

  const maxArtists = 5;
  const isMaxReached = artists.length >= maxArtists;

  return (
    <div className='flex flex-col gap-small'>
      <Autocomplete
        multiple
        disableCloseOnSelect
        blurOnSelect={false}
        forcePopupIcon={false}
        disabled={isMaxReached}
        open={isOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        options={availableFriends}
        value={artists}
        onChange={handleChange}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        filterOptions={autocompleteFilterOptions}
        noOptionsText={translate('Label.NoFriendsFound')}
        renderTags={() => null}
        renderOption={(props, option) => (
          <li {...props} key={option.userId}>
            <ThumbnailWithNames
              target={{ id: option.userId, name: option.username, displayName: option.displayName }}
              disableLink
              variant='compact'
              targetType={CreatorType.User}
            />
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            size='small'
            label=''
            InputProps={{
              ...params.InputProps,
            }}
            inputProps={{
              ...params.inputProps,
              'aria-label': translate('Heading.SongArtist'),
              placeholder: isMaxReached ? '' : translate('Label.SongArtistName'),
            }}
          />
        )}
      />
      {artists.length > 0 && (
        <>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={artists.map((v) => v.userId)}>
              <div className='flex flex-col'>
                {artists.map((artist) => (
                  <SortableArtistChip
                    key={artist.userId}
                    artist={artist}
                    onDelete={() =>
                      onArtistsChange(artists.filter((a) => a.userId !== artist.userId))
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Typography variant='caption' color='secondary'>
            {`${artists.length}/${maxArtists}`}
          </Typography>
        </>
      )}
    </div>
  );
};

export default SongArtistsSection;
