import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  RobloxTranslationRolesApiAssigneeTypeEnum,
  RobloxTranslationRolesApiUpdateRoleRequestAssigneeTypeEnum,
  RobloxTranslationRolesApiAssignee,
  V1GameLocalizationRolesRolesRoleCurrentUserGetRoleEnum,
  RobloxTranslationRolesApiUpdateRoleRequest,
  GameLocalizationRolesApi,
  RobloxTranslationRolesApiUpdateRoleRequestRoleEnum,
  V1GameLocalizationRolesGamesGameIdRolesRoleAssigneesGetRoleEnum,
} from '@rbx/clients/translationroles';
import { getBEDEV1ServiceBasePath } from '@modules/clients/utils';

export { RobloxTranslationRolesApiAssigneeTypeEnum as TranslatorType } from '@rbx/clients/translationroles';
export type { RobloxGameLocalizationClientGameLocalizationRolesGameLocalizationRoleAssignment as TranslatorGames } from '@rbx/clients/translationroles';

export type TranslatorData = RobloxTranslationRolesApiAssignee;
export enum UserRoleType {
  translator = 'translator',
  owner = 'owner',
}

export class TranslationRoleClient {
  private gameLocalizationRolesAPI: GameLocalizationRolesApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('translationroles')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.gameLocalizationRolesAPI = new GameLocalizationRolesApi(configuration);
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
      userRoles: response.data?.map(
        (item: string) => UserRoleType[item as keyof typeof UserRoleType],
      ),
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
      default:
        requestType = RobloxTranslationRolesApiUpdateRoleRequestAssigneeTypeEnum.GroupRole;
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
