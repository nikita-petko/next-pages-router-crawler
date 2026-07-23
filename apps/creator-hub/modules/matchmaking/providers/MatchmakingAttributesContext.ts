import { createContext } from 'react';
import type {
  AttributesInfo,
  PlayerAttributesBriefInfo,
  PlayerAttributesDetailedInfo,
  ServerAttributesInfo,
} from '../types/AttributesInfo';

export interface MatchmakingAttributesValue {
  currentPlayerAttributeDetailedInfo: PlayerAttributesDetailedInfo | undefined;
  currentServerAttribute: ServerAttributesInfo | undefined;
  allServerAttributes: ServerAttributesInfo[] | undefined;
  allPlayerBriefAttributes: PlayerAttributesBriefInfo[] | undefined;
  allPlayerDetailedAttributes: PlayerAttributesDetailedInfo[] | undefined;
  allAttributesList: AttributesInfo[] | undefined;
  handleAddPlayerAttribute: (attribute: PlayerAttributesDetailedInfo) => Promise<boolean>;
  handleAddServerAttribute: (attribute: ServerAttributesInfo) => Promise<boolean>;
  handleUpdatePlayerAttribute: (attribute: PlayerAttributesDetailedInfo) => Promise<boolean>;
  handleUpdateServerAttribute: (attribute: ServerAttributesInfo) => Promise<boolean>;
  handleDeletePlayerAttribute: (attributeId: string | undefined) => Promise<boolean>;
  handleDeleteServerAttribute: (attributeId: string | undefined) => Promise<boolean>;
  isLoadingPlayerAttributes: boolean;
  isLoadingServerAttributes: boolean;
  isUpdatingPlayerAttributes: boolean;
  isUpdatingServerAttributes: boolean;
  fetchPlayerAttributesError: Error | null;
  fetchServerAttributesError: Error | null;
  updatePlayerAttributesError: Error | null;
  updateServerAttributesError: Error | null;
}

const matchmakingAttributesContext = createContext<MatchmakingAttributesValue>({
  currentPlayerAttributeDetailedInfo: undefined,
  currentServerAttribute: undefined,
  allServerAttributes: undefined,
  allPlayerBriefAttributes: undefined,
  allPlayerDetailedAttributes: undefined,
  allAttributesList: undefined,
  handleAddPlayerAttribute: async () => false,
  handleAddServerAttribute: async () => false,
  handleUpdatePlayerAttribute: async () => false,
  handleUpdateServerAttribute: async () => false,
  handleDeletePlayerAttribute: async () => false,
  handleDeleteServerAttribute: async () => false,
  isLoadingPlayerAttributes: false,
  isLoadingServerAttributes: false,
  isUpdatingPlayerAttributes: false,
  isUpdatingServerAttributes: false,
  fetchPlayerAttributesError: null,
  fetchServerAttributesError: null,
  updatePlayerAttributesError: null,
  updateServerAttributesError: null,
});

export default matchmakingAttributesContext;
