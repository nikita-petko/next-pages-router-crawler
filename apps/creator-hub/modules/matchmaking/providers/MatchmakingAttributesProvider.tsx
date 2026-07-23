import React, { FunctionComponent, useCallback, useState, useMemo, useEffect } from 'react';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  CustomSignalType,
  MatchmakingAttributeDataType,
  MatchmakingAttributeValue,
  MatchmakingAttributeValueLocationCase,
  MatchmakingAttributeValueType,
  MatchmakingServerAttributeDefaultValueSourceCase,
  MatchmakingServerAttributeDefinition,
} from '@rbx/clients/matchmakingApi/v1';
import { matchmakingClient } from '@modules/react-query/matchmaking/matchmakingRequests';
import {
  AttributesInfo,
  PlayerAttributesBriefInfo,
  PlayerAttributesDetailedInfo,
  ServerAttributesInfo,
} from '../types/AttributesInfo';
import MatchmakingAttributesContext from './MatchmakingAttributesContext';
import AttributeDataType from '../enums/AttributeDataType';
import { EqualityMatchAttributeType } from '../enums/MatchAttributeType';
import AttributeType from '../enums/AttributeType';

export interface MatchmakingAttributesProviderProps {
  playerAttributeId?: string;
  serverAttributeId?: string;
}

const MatchmakingAttributesProvider: FunctionComponent<
  React.PropsWithChildren<MatchmakingAttributesProviderProps>
> = ({ playerAttributeId, serverAttributeId, children }) => {
  const [isLoadingPlayerAttributes, setIsLoadingPlayerAttributes] = useState<boolean>(false);
  const [allPlayerBriefAttributes, setAllPlayerBriefAttributes] = useState<
    PlayerAttributesBriefInfo[] | undefined
  >(undefined);
  const [allPlayerDetailedAttributes, setAllPlayerDetailedAttributes] = useState<
    PlayerAttributesDetailedInfo[] | undefined
  >(undefined);
  const [isLoadingServerAttributes, setIsLoadingServerAttributes] = useState<boolean>(false);
  const [serverAttributeSchemas, setAllServerAttributeSchemas] = useState<
    MatchmakingServerAttributeDefinition[] | undefined
  >(undefined);
  const [fetchPlayerAttributesError, setFetchPlayerAttributesError] = useState<Error | null>(null);
  const [fetchServerAttributesError, setFetchServerAttributesError] = useState<Error | null>(null);
  const [isUpdatingPlayerAttributes, setIsUpdatingPlayerAttributes] = useState<boolean>(false);
  const [updatePlayerAttributesError, setUpdatePlayerAttributesError] = useState<Error | null>(
    null,
  );
  const [isUpdatingServerAttributes, setIsUpdatingServerAttributes] = useState<boolean>(false);
  const [updateServerAttributesError, setUpdateServerAttributesError] = useState<Error | null>(
    null,
  );
  const { gameDetails } = useCurrentGame();

  const gameId = useMemo(() => {
    return gameDetails?.id;
  }, [gameDetails]);

  const getAttributeDataType = (
    clientAttributeType: MatchmakingAttributeDataType | undefined,
  ): AttributeDataType | undefined => {
    switch (clientAttributeType) {
      case MatchmakingAttributeDataType.Bool:
        return AttributeDataType.Boolean;
      case MatchmakingAttributeDataType.Number:
        return AttributeDataType.Double;
      case MatchmakingAttributeDataType.String:
        return AttributeDataType.String;
      default:
        return undefined;
    }
  };

  const getDefaultValueType = (
    clientDefaultValueType: MatchmakingServerAttributeDefaultValueSourceCase | undefined,
  ) => {
    if (
      !clientDefaultValueType ||
      clientDefaultValueType === MatchmakingServerAttributeDefaultValueSourceCase.Invalid
    ) {
      return undefined;
    }
    return clientDefaultValueType === MatchmakingServerAttributeDefaultValueSourceCase.Constant
      ? EqualityMatchAttributeType.ConstantValue
      : EqualityMatchAttributeType.PlayerAttribute;
  };

  const getConstantValue = (
    matchmakingAttributeValue: MatchmakingAttributeValue | undefined,
    dataType: AttributeDataType | undefined,
  ): string | undefined => {
    switch (dataType) {
      case AttributeDataType.Boolean:
        return matchmakingAttributeValue?.boolValue === true ? 'True' : 'False';
      case AttributeDataType.Double:
        return matchmakingAttributeValue?.numericValue?.toString() ?? undefined;
      case AttributeDataType.String:
        return matchmakingAttributeValue?.stringValue ?? undefined;
      default:
        return undefined;
    }
  };

  const getPlayerAttributesForUniverse = useCallback((universeId: number) => {
    setIsLoadingPlayerAttributes(true);
    matchmakingClient
      .getPlayerAttributes({
        universeId,
      })
      .then((response) => {
        const { playerAttributeSchema } = response;
        if (playerAttributeSchema) {
          const playerBriefAttributes: PlayerAttributesBriefInfo[] = [];
          const playerDetailedAttributes: PlayerAttributesDetailedInfo[] = [];
          playerAttributeSchema.forEach((attribute) => {
            const dataType = getAttributeDataType(attribute.dataType);
            const briefAttribute: PlayerAttributesBriefInfo = {
              id: attribute.id ?? undefined,
              name: attribute.name ?? undefined,
              dataType,
              constantValue: getConstantValue(attribute.defaultValue, dataType),
            };
            playerBriefAttributes.push(briefAttribute);

            const detailedAttribute: PlayerAttributesDetailedInfo = {
              ...briefAttribute,
              dataStoreLocation: attribute.attributeValueLocation?.dataStoreLocation,
            };

            playerDetailedAttributes.push(detailedAttribute);
          });
          setAllPlayerBriefAttributes(playerBriefAttributes);
          setAllPlayerDetailedAttributes(playerDetailedAttributes);
        }
        setFetchPlayerAttributesError(null);
      })
      .catch(() => {
        setAllPlayerDetailedAttributes(undefined);
        setFetchPlayerAttributesError(Error('Failed to fetch player attributes for universe'));
      })
      .finally(() => {
        setIsLoadingPlayerAttributes(false);
      });
  }, []);

  const getServerAttributesForUniverse = useCallback((universeId: number) => {
    setIsLoadingServerAttributes(true);
    matchmakingClient
      .getServerAttributes({
        universeId,
      })
      .then((response) => {
        const { serverAttributeSchema } = response;
        if (serverAttributeSchema) {
          setAllServerAttributeSchemas(serverAttributeSchema);
        }
        setFetchServerAttributesError(null);
      })
      .catch(() => {
        setAllServerAttributeSchemas(undefined);
        setFetchServerAttributesError(Error('Failed to fetch player attributes for universe'));
      })
      .finally(() => {
        setIsLoadingServerAttributes(false);
      });
  }, []);

  const updateAttributes = useCallback(() => {
    if (gameId) {
      getPlayerAttributesForUniverse(gameId);
      getServerAttributesForUniverse(gameId);
    }
  }, [gameId, getPlayerAttributesForUniverse, getServerAttributesForUniverse]);

  const allServerAttributes = useMemo(() => {
    if (!serverAttributeSchemas) {
      return undefined;
    }
    const serverAttributes: ServerAttributesInfo[] = [];
    serverAttributeSchemas.forEach((attribute) => {
      const dataType = getAttributeDataType(attribute.dataType);
      let playerAttribute;
      if (
        attribute.defaultValue?.sourceCase ===
        MatchmakingServerAttributeDefaultValueSourceCase.PlayerAttributeReference
      ) {
        playerAttribute = allPlayerBriefAttributes?.find(
          (playerAttr) => playerAttr.id === attribute.defaultValue?.playerAttributeReference,
        );
      }
      const serverAttribute: ServerAttributesInfo = {
        id: attribute.id ?? undefined,
        name: attribute.name ?? undefined,
        dataType,
        defaultValueType: getDefaultValueType(attribute.defaultValue?.sourceCase),
        constantValue:
          attribute.defaultValue?.sourceCase ===
          MatchmakingServerAttributeDefaultValueSourceCase.Constant
            ? getConstantValue(attribute.defaultValue?.constant, dataType)
            : undefined,
        matchingPlayerAttribute: playerAttribute,
      };
      serverAttributes.push(serverAttribute);
    });
    return serverAttributes;
  }, [allPlayerBriefAttributes, serverAttributeSchemas]);

  useEffect(() => {
    if (gameId) {
      getPlayerAttributesForUniverse(gameId);
    }
  }, [gameId, getPlayerAttributesForUniverse]);

  useEffect(() => {
    if (gameId) {
      getServerAttributesForUniverse(gameId);
    }
  }, [gameId, getServerAttributesForUniverse]);

  const currentPlayerAttributeDetailedInfo = useMemo(() => {
    if (!playerAttributeId || isLoadingPlayerAttributes || !allPlayerDetailedAttributes) {
      return undefined;
    }
    return allPlayerDetailedAttributes.find((attribute) => attribute.id === playerAttributeId);
  }, [allPlayerDetailedAttributes, isLoadingPlayerAttributes, playerAttributeId]);

  const currentServerAttribute = useMemo(() => {
    if (!serverAttributeId || isLoadingServerAttributes || !allServerAttributes) {
      return undefined;
    }
    return allServerAttributes.find((attribute) => attribute.id === serverAttributeId);
  }, [allServerAttributes, isLoadingServerAttributes, serverAttributeId]);

  const getMatchmakingAttributeDataType = (
    attributeDataType: AttributeDataType | undefined,
  ): MatchmakingAttributeDataType | undefined => {
    if (!attributeDataType) {
      return undefined;
    }
    switch (attributeDataType) {
      case AttributeDataType.Boolean:
        return MatchmakingAttributeDataType.Bool;
      case AttributeDataType.Double:
        return MatchmakingAttributeDataType.Number;
      case AttributeDataType.String:
        return MatchmakingAttributeDataType.String;
      default:
        return undefined;
    }
  };

  const getDefaultConstantValue = (
    constantValue: string | undefined,
    attributeDataType: AttributeDataType | undefined,
  ): MatchmakingAttributeValue | undefined => {
    if (constantValue === undefined || attributeDataType === undefined) {
      return undefined;
    }
    switch (attributeDataType) {
      case AttributeDataType.Double:
        return {
          type: MatchmakingAttributeValueType.Number,
          numericValue: parseFloat(constantValue),
        };
      case AttributeDataType.String:
        return {
          type: MatchmakingAttributeValueType.String,
          stringValue: constantValue.toString(),
        };
      case AttributeDataType.Boolean:
        return {
          type: MatchmakingAttributeValueType.Bool,
          boolValue: constantValue === 'True',
        };
      default:
        return undefined;
    }
  };

  const getDefaultServerConstantValue = useCallback(
    (
      attributeDataType?: AttributeDataType,
      defaultValueType?: EqualityMatchAttributeType,
      constantValue?: string,
      matchingPlayerAttribute?: PlayerAttributesBriefInfo,
    ) => {
      if (!attributeDataType) {
        return undefined;
      }
      return {
        sourceCase:
          defaultValueType === EqualityMatchAttributeType.ConstantValue
            ? MatchmakingServerAttributeDefaultValueSourceCase.Constant
            : MatchmakingServerAttributeDefaultValueSourceCase.PlayerAttributeReference,
        constant: getDefaultConstantValue(constantValue, attributeDataType),
        playerAttributeReference: {
          id: matchingPlayerAttribute?.id,
        },
      };
    },
    [],
  );

  const handleAddPlayerAttribute = useCallback(
    async (attribute: PlayerAttributesDetailedInfo) => {
      if (!gameId) {
        return false;
      }
      try {
        setUpdatePlayerAttributesError(null);
        setIsUpdatingPlayerAttributes(true);
        await matchmakingClient.createPlayerAttribute({
          createMatchmakingPlayerAttributeDefinitionRequest: {
            universeId: gameId,
            name: attribute.name,
            dataType: getMatchmakingAttributeDataType(attribute.dataType),
            defaultValue: getDefaultConstantValue(attribute.constantValue, attribute.dataType),
            attributeValueLocation: {
              locationCase:
                attribute.dataStoreLocation !== undefined
                  ? MatchmakingAttributeValueLocationCase.DataStoreLocation
                  : undefined,
              dataStoreLocation: attribute.dataStoreLocation,
            },
          },
        });
        setIsUpdatingPlayerAttributes(false);
        updateAttributes();
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdatePlayerAttributesError(catchedError);
        setIsUpdatingPlayerAttributes(false);
        return false;
      }
    },
    [gameId, updateAttributes],
  );

  const handleAddServerAttribute = useCallback(
    async (attribute: ServerAttributesInfo) => {
      if (!gameId) {
        return false;
      }
      try {
        setUpdateServerAttributesError(null);
        setIsUpdatingServerAttributes(true);
        await matchmakingClient.createServerAttribute({
          createMatchmakingServerAttributeDefinitionRequest: {
            universeId: gameId,
            name: attribute.name,
            dataType: getMatchmakingAttributeDataType(attribute.dataType),
            defaultValue: getDefaultServerConstantValue(
              attribute.dataType,
              attribute.defaultValueType,
              attribute.constantValue,
              attribute.matchingPlayerAttribute,
            ),
          },
        });
        setUpdateServerAttributesError(null);
        setIsUpdatingPlayerAttributes(false);
        updateAttributes();
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateServerAttributesError(catchedError);
        setIsUpdatingServerAttributes(false);
        return false;
      }
    },
    [gameId, getDefaultServerConstantValue, updateAttributes],
  );

  const handleUpdatePlayerAttribute = useCallback(
    async (attribute: PlayerAttributesDetailedInfo) => {
      if (!currentPlayerAttributeDetailedInfo?.id) {
        return false;
      }
      try {
        setUpdatePlayerAttributesError(null);
        setIsUpdatingPlayerAttributes(true);
        await matchmakingClient.updatePlayerAttribute({
          attributeId: currentPlayerAttributeDetailedInfo?.id,
          updateMatchmakingPlayerAttributeDefinitionRequest: {
            attributeId: currentPlayerAttributeDetailedInfo?.id,
            defaultValue: getDefaultConstantValue(attribute.constantValue, attribute.dataType),
            attributeValueLocation: {
              locationCase:
                attribute.dataStoreLocation !== undefined
                  ? MatchmakingAttributeValueLocationCase.DataStoreLocation
                  : undefined,
              dataStoreLocation: attribute.dataStoreLocation,
            },
          },
        });
        setUpdatePlayerAttributesError(null);
        setIsUpdatingPlayerAttributes(false);
        updateAttributes();
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdatePlayerAttributesError(catchedError);
        setIsUpdatingPlayerAttributes(false);
        return false;
      }
    },
    [currentPlayerAttributeDetailedInfo?.id, updateAttributes],
  );

  const handleUpdateServerAttribute = useCallback(
    async (attribute: ServerAttributesInfo) => {
      if (!currentServerAttribute?.id) {
        return false;
      }
      try {
        setUpdateServerAttributesError(null);
        setIsUpdatingServerAttributes(true);
        await matchmakingClient.updateServerAttribute({
          attributeId: currentServerAttribute?.id,
          updateMatchmakingServerAttributeDefinitionRequest: {
            attributeId: currentServerAttribute?.id,
            defaultValue: getDefaultServerConstantValue(
              attribute.dataType,
              attribute.defaultValueType,
              attribute.constantValue,
              attribute.matchingPlayerAttribute,
            ),
          },
        });
        setUpdateServerAttributesError(null);
        setIsUpdatingPlayerAttributes(false);
        updateAttributes();
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateServerAttributesError(catchedError);
        setIsUpdatingServerAttributes(false);
        return false;
      }
    },
    [currentServerAttribute?.id, getDefaultServerConstantValue, updateAttributes],
  );

  const handleDeletePlayerAttribute = useCallback(
    async (attributeId: string | undefined) => {
      if (!attributeId) {
        return false;
      }
      try {
        setUpdatePlayerAttributesError(null);
        setIsUpdatingPlayerAttributes(true);
        await matchmakingClient.deletePlayerAttribute({
          attributeId,
        });
        setUpdatePlayerAttributesError(null);
        setIsUpdatingPlayerAttributes(false);
        updateAttributes();
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdatePlayerAttributesError(catchedError);
        setIsUpdatingPlayerAttributes(false);
        return false;
      }
    },
    [updateAttributes],
  );

  const handleDeleteServerAttribute = useCallback(
    async (attributeId: string | undefined) => {
      if (!attributeId) {
        return false;
      }
      try {
        setUpdateServerAttributesError(null);
        setIsUpdatingServerAttributes(true);
        await matchmakingClient.deleteServerAttribute({
          attributeId,
        });
        setUpdateServerAttributesError(null);
        setIsUpdatingPlayerAttributes(false);
        updateAttributes();
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateServerAttributesError(catchedError);
        setIsUpdatingServerAttributes(false);
        return false;
      }
    },
    [updateAttributes],
  );

  const getCustomSignalType = (
    attributeType: AttributeType,
    attributeDataType: AttributeDataType | undefined,
  ) => {
    if (!attributeDataType) {
      return undefined;
    }
    if (attributeType === AttributeType.Player) {
      return attributeDataType === AttributeDataType.Double
        ? CustomSignalType.PlayerNumerical
        : CustomSignalType.PlayerCategorical;
    }
    return attributeDataType === AttributeDataType.Double
      ? CustomSignalType.ServerNumerical
      : CustomSignalType.ServerCategorical;
  };

  const allAttributesList: AttributesInfo[] | undefined = useMemo(() => {
    if (isLoadingPlayerAttributes || isLoadingServerAttributes) {
      return undefined;
    }
    const allAttributes: AttributesInfo[] = [];
    allPlayerBriefAttributes?.forEach((playerAttr) => {
      allAttributes.push({
        id: playerAttr?.id,
        customSignalType: getCustomSignalType(AttributeType.Player, playerAttr.dataType),
        playerAttribute: playerAttr,
      });
    });
    allServerAttributes?.forEach((serverAttr) => {
      allAttributes.push({
        id: serverAttr.id,
        customSignalType: getCustomSignalType(AttributeType.Server, serverAttr.dataType),
        serverAttribute: serverAttr,
      });
    });

    return allAttributes;
  }, [
    allPlayerBriefAttributes,
    allServerAttributes,
    isLoadingPlayerAttributes,
    isLoadingServerAttributes,
  ]);

  const providerValue = useMemo(() => {
    return {
      currentPlayerAttributeDetailedInfo,
      currentServerAttribute,
      allServerAttributes,
      allPlayerBriefAttributes,
      allPlayerDetailedAttributes,
      allAttributesList,
      handleAddPlayerAttribute,
      handleAddServerAttribute,
      handleUpdatePlayerAttribute,
      handleUpdateServerAttribute,
      handleDeletePlayerAttribute,
      handleDeleteServerAttribute,
      isLoadingPlayerAttributes,
      isLoadingServerAttributes,
      isUpdatingPlayerAttributes,
      isUpdatingServerAttributes,
      fetchPlayerAttributesError,
      fetchServerAttributesError,
      updatePlayerAttributesError,
      updateServerAttributesError,
    };
  }, [
    currentPlayerAttributeDetailedInfo,
    currentServerAttribute,
    allServerAttributes,
    allPlayerBriefAttributes,
    allPlayerDetailedAttributes,
    allAttributesList,
    handleAddPlayerAttribute,
    handleAddServerAttribute,
    handleUpdatePlayerAttribute,
    handleUpdateServerAttribute,
    handleDeletePlayerAttribute,
    handleDeleteServerAttribute,
    isLoadingPlayerAttributes,
    isLoadingServerAttributes,
    isUpdatingPlayerAttributes,
    isUpdatingServerAttributes,
    fetchPlayerAttributesError,
    fetchServerAttributesError,
    updatePlayerAttributesError,
    updateServerAttributesError,
  ]);

  return (
    <MatchmakingAttributesContext.Provider value={providerValue}>
      {children}
    </MatchmakingAttributesContext.Provider>
  );
};

export default MatchmakingAttributesProvider;
