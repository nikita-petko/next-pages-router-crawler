export const getEscapedLuaKey = (key: string): string => {
  // Split on:
  // 1. lowercase to uppercase transitions
  // 2. letter to number transitions
  // 3. number to letter transitions
  const words = key
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2') // handle lowercase to uppercase
    .replaceAll(/([A-Za-z])([0-9])/g, '$1 $2') // handle letter to number
    .replaceAll(/([0-9])([A-Za-z])/g, '$1 $2') // handle number to letter
    .trim()
    .split(' ');

  // Convert to uppercase and join with underscores
  const snakeCase = words.map((word) => word.toUpperCase()).join('_');

  // Apply any existing escaping logic
  return snakeCase.replaceAll(/[^a-zA-Z0-9_]/g, '_');
};

export const getEscapedLuaIdentifier = (key: string): string => {
  const cleaned = key.replaceAll(/[^a-zA-Z0-9_]/g, '_').replaceAll(/_+/g, '_');
  if (!cleaned) {
    return '';
  }
  if (/^[0-9]/.test(cleaned)) {
    return `_${cleaned}`;
  }
  return cleaned;
};

const generateSnippet = (key: string, isTargetingConfigsEnabled = false): string => {
  const luaKey = getEscapedLuaKey(key);
  const valueIdentifier = getEscapedLuaIdentifier(key) || 'value';
  const escapedKeyLiteral = key.replaceAll(/\\/g, '\\\\').replaceAll(/"/g, '\\"');

  if (isTargetingConfigsEnabled) {
    return `local ConfigService = game:GetService("ConfigService")
local Players = game:GetService("Players")
local ${luaKey} = "${escapedKeyLiteral}"

local function onPlayerAdded(player)
    local playerConfigSnapshot = ConfigService:GetConfigForPlayerAsync(player)
    local ${valueIdentifier} = playerConfigSnapshot:GetValue(${luaKey})
end

Players.PlayerAdded:Connect(onPlayerAdded)`;
  }

  return `local ConfigService = game:GetService("ConfigService")
local config = ConfigService:GetConfigAsync()
local ${luaKey} = "${escapedKeyLiteral}"
local ${valueIdentifier} = config:GetValue(${luaKey})`;
};
export type TSnippetGenerationFunction = (
  key: string,
  isTargetingConfigsEnabled?: boolean,
) => string;
export default generateSnippet;
