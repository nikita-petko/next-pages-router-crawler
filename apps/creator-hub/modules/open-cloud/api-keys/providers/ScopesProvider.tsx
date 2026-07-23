import { createContext, useEffect, useState } from 'react';
import type {
  Scope,
  ScopeType,
  TargetType,
  TargetPart,
  GetScopesResponse,
  Product,
} from '@modules/clients/cloudAuthentication';
import cloudAuthClient from '@modules/clients/cloudAuthentication';

/**
 * The /v1/scopes response is scope-centric: `scopes` is the primary list where each entry is a (scope type, operation)
 * pair carrying its own target type, description, risk level and group eligibility. Scope types, target types, target
 * parts and products are slim supporting collections referenced by name.
 *
 * The backend returns a list for each model, but all names have a uniqueness constraint (enforced by backend), meaning
 * we can key the supporting collections by name for faster look-ups. The scope list is exposed as-is so consumers can
 * derive per-(scope type, operation) data directly.
 */
export interface ScopeContextValue {
  scopes?: Scope[];
  scopeTypesMap?: { [name: string]: ScopeType };
  targetPartsMap?: { [name: string]: TargetPart };
  targetTypesMap?: { [name: string]: TargetType };
  productsMap?: { [name: string]: Product };
}

export const ScopesContext = createContext<ScopeContextValue>({
  scopes: undefined,
  scopeTypesMap: undefined,
  targetPartsMap: undefined,
  targetTypesMap: undefined,
  productsMap: undefined,
});

interface ScopesProviderProps {
  groupId?: number;
}

function buildNameMap<T extends { name?: string }>(items?: T[]): { [name: string]: T } {
  return (items ?? []).reduce<{ [name: string]: T }>((map, item) => {
    return item.name ? Object.assign(map, { [item.name]: item }) : map;
  }, {});
}

const ScopesProvider = ({ groupId, children }: React.PropsWithChildren<ScopesProviderProps>) => {
  const [value, setValue] = useState<ScopeContextValue>({});

  const buildScopeSystem = (config: GetScopesResponse) => {
    setValue({
      scopes: config.scopes ?? [],
      scopeTypesMap: buildNameMap(config.scopeTypes),
      targetTypesMap: buildNameMap(config.targetTypes),
      targetPartsMap: buildNameMap(config.targetParts),
      productsMap: buildNameMap(config.products),
    });
  };

  useEffect(() => {
    const getScopes = async () => {
      try {
        const config = await cloudAuthClient.getScopes(groupId);
        buildScopeSystem(config);
      } catch {
        console.warn('There was an error fetching the scopes');
      }
    };

    void getScopes();
  }, [groupId]);

  return <ScopesContext.Provider value={value}>{children}</ScopesContext.Provider>;
};

export default ScopesProvider;
