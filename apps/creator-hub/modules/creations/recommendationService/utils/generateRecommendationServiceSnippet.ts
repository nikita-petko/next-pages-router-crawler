const escapeLuaStringLiteral = (value: string): string => {
  return value.replaceAll(/\\/g, '\\\\').replaceAll(/"/g, '\\"');
};

const generateRecommendationServiceSnippet = (configName: string): string => {
  const escapedConfigName = escapeLuaStringLiteral(configName);
  return `local RecommendationService = game:GetService("RecommendationService")

-- Define the request for generating a recommendation list
local request: GenerateRecommendationItemListRequest = {
  ConfigName = "${escapedConfigName}",
  LocationId = "Lobby",
  PageSize = 10
  -- NOTE: Uncomment and set CustomContexts.UserId for Server script.
  -- No need to set for Local script.
  -- CustomContexts = {
  -- ["UserId"] = tostring(player.UserId),
  -- }
}

-- Call GenerateItemListAsync to get the recommendation pages
local success, recommendationPages = pcall(function()
  return RecommendationService:GenerateItemListAsync(request)
end)`;
};

export default generateRecommendationServiceSnippet;
