/* eslint-disable import/prefer-default-export */
/* eslint-disable @rbx/no-hardcoded-url */
import { TBuildTarget } from "../types";

export const getProductionCreatorHubUrl = (target: TBuildTarget) => {
  if (target === "luobu") {
    return "https://create.roblox.cn";
  }

  return "https://create.roblox.com";
};
