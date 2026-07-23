import { Autocomplete, makeStyles } from '@rbx/ui';
import { ReactNode } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { UniverseShapeType } from '@type/universe';

export const logDestinationChangeEvent = (universeObj: AutocompleteOption | null) => {
  if (universeObj) {
    unifiedLogger.logClickEvent({
      eventName: EventName.DestinationSelected,
      parameters: {
        destinationPaidAccess: universeObj.paidAccess?.toString() || '',
        destinationPlaceId: universeObj.rootPlaceId.toString(),
        destinationSeventeenPlusAgeRating: universeObj.seventeenPlusAgeRating?.toString() || '',
        destinationText: universeObj.universeName,
        destinationUniverseId: universeObj.universeId.toString(),
      },
    });
  } else {
    unifiedLogger.logClickEvent({
      eventName: EventName.DestinationRemoved,
    });
  }
};

export const convertServerUniverseToAutocompletOption = (universeObj: UniverseShapeType) => {
  return {
    paidAccess: universeObj.paid_access,
    rootPlaceId: universeObj.root_place_id,
    seventeenPlusAgeRating: universeObj.seventeen_plus_age_rating,
    universeId: universeObj.universe_id,
    universeName: universeObj.universe_name,
  };
};

export interface AutocompleteOption {
  paidAccess?: boolean;
  rootPlaceId: number;
  seventeenPlusAgeRating?: boolean;
  universeId: number;
  universeName: string;
}

export const SelectUniverseAutocomplete = ({
  disabled = false,
  getOptionLabelFn,
  id,
  onChange,
  portalDestinations,
  renderInputFn,
  rootClass,
  value,
}: {
  disabled?: boolean;
  getOptionLabelFn?: (adPortalDestinationOption: AutocompleteOption) => string;
  id: string;
  onChange?: (_event: unknown, universeObj: AutocompleteOption | null) => void;
  portalDestinations: AutocompleteOption[];
  renderInputFn: (params: object) => ReactNode;
  rootClass?: string;
  value: {
    rootPlaceId: number;
    universeId: number;
    universeName: string;
  };
}) => {
  const {
    classes: { configureAdInput },
  } = makeStyles()(() => ({
    configureAdInput: {
      width: '100%',
    },
  }))();
  return (
    <Autocomplete<AutocompleteOption>
      classes={{ root: rootClass || configureAdInput }}
      disabled={disabled}
      getOptionLabel={getOptionLabelFn}
      id={id}
      onChange={onChange}
      options={portalDestinations}
      renderInput={renderInputFn}
      value={value}
    />
  );
};
