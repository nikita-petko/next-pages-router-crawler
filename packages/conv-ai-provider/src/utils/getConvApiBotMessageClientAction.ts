import type { BotMessageClientAction, WSNotificationBotMessageClientAction } from '../types';
import { ConvApiV2ActionType } from '../types';

// parse actions returned by ws notification for createConversation usage
// ref:
// https://github.rbx.com/Roblox/grasshopper/blob/master/packages/clients/schemas/convAiPlatformOrchestration/v1.json
const getConvApiBotMessageClientAction = (
  action: BotMessageClientAction | WSNotificationBotMessageClientAction,
  botMessageContent: string,
): BotMessageClientAction => ({
  ...action,
  arguments: {
    text: botMessageContent,
  },
  command: action.command ?? ConvApiV2ActionType.DisplayRichText,
  plugin: action.plugin ?? '',
});

export default getConvApiBotMessageClientAction;
