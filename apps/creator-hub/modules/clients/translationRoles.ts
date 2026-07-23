import type {
  RobloxTranslationRolesApiAssignee,
  RobloxTranslationRolesApiUpdateRoleRequest,
} from '@rbx/client-translationroles/v1';
import {
  RobloxTranslationRolesApiAssigneeTypeEnum,
  RobloxTranslationRolesApiUpdateRoleRequestAssigneeTypeEnum,
  V1GameLocalizationRolesRolesRoleCurrentUserGetRoleEnum,
  GameLocalizationRolesApi,
  RobloxTranslationRolesApiUpdateRoleRequestRoleEnum,
  V1GameLocalizationRolesGamesGameIdRolesRoleAssigneesGetRoleEnum,
} from '@rbx/client-translationroles/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export { RobloxTranslationRolesApiAssigneeTypeEnum as TranslatorType } from '@rbx/client-translationroles/v1';
export type { RobloxGameLocalizationClientGameLocalizationRolesGameLocalizationRoleAssignment as TranslatorGames } from '@rbx/client-translationroles/v1';

export type TranslatorData = RobloxTranslationRolesApiAssignee;
export enum UserRoleType {
  translator = 'translator',
  owner = 'owner',
}

export class TranslationRoleClient {
  private gameLocalizationRolesAPI: GameLocalizationRolesApi;

  constructor() {
    this.gameLocalizationRolesAPI = new GameLocalizationRolesApi(
      createClientConfiguration('translationroles', 'bedev1'),
    );
  }

  async getCurrentRole(gameId: number) {
    const response =
      await this.gameLocalizationRolesAPI.v1GameLocalizationRolesGamesGameIdCurrentUserRolesGet({
        gameId,
      });
    if (!response.data) {
      return {
        userRoles: [],
      };
    }
    return {
      userRoles: response.data
        ?.filter((item: string) => item in UserRoleType)
        .map((item: string) => (UserRoleType as Record<string, UserRoleType>)[item]),
    };
  }

  async getTranslatorsByGameId(gameId: number) {
    return this.gameLocalizationRolesAPI.v1GameLocalizationRolesGamesGameIdRolesRoleAssigneesGet({
      gameId,
      role: V1GameLocalizationRolesGamesGameIdRolesRoleAssigneesGetRoleEnum.Translator,
    });
  }

  async deleteTranslator(
    gameId: number,
    assigneeId: number,
    type: RobloxTranslationRolesApiAssigneeTypeEnum,
  ) {
    return this.modifyTranslator(gameId, assigneeId, type, true);
  }

  async addTranslator(
    gameId: number,
    assigneeId: number,
    type: RobloxTranslationRolesApiAssigneeTypeEnum,
  ) {
    return this.modifyTranslator(gameId, assigneeId, type, false);
  }

  async modifyTranslator(
    gameId: number,
    assigneeId: number,
    type: RobloxTranslationRolesApiAssigneeTypeEnum,
    isDelete: boolean,
  ) {
    let requestType: RobloxTranslationRolesApiUpdateRoleRequestAssigneeTypeEnum;
    switch (type) {
      case RobloxTranslationRolesApiAssigneeTypeEnum.User:
        requestType = RobloxTranslationRolesApiUpdateRoleRequestAssigneeTypeEnum.User;
        break;
      case RobloxTranslationRolesApiAssigneeTypeEnum.Group:
        requestType = RobloxTranslationRolesApiUpdateRoleRequestAssigneeTypeEnum.Group;
        break;
      case RobloxTranslationRolesApiAssigneeTypeEnum.GroupRole:
        requestType = RobloxTranslationRolesApiUpdateRoleRequestAssigneeTypeEnum.GroupRole;
        break;
    }
    const request: RobloxTranslationRolesApiUpdateRoleRequest = {
      assigneeId,
      role: RobloxTranslationRolesApiUpdateRoleRequestRoleEnum.Translator,
      assigneeType: requestType,
    };
    if (isDelete) {
      request.revoke = true;
    }
    return this.gameLocalizationRolesAPI.v1GameLocalizationRolesGamesGameIdPatch({
      gameId,
      request,
    });
  }

  async getCurrentTranslatorGames(
    exclusiveStartKey: string | undefined,
    pageSize: number,
    groupId?: number,
  ) {
    const response =
      await this.gameLocalizationRolesAPI.v1GameLocalizationRolesRolesRoleCurrentUserGetRaw({
        role: V1GameLocalizationRolesRolesRoleCurrentUserGetRoleEnum.Translator,
        groupId: groupId ?? 0,
        exclusiveStartKey,
        pageSize,
      });
    return response.value();
  }
}

const translationRoleClient = new TranslationRoleClient();

export default translationRoleClient;
