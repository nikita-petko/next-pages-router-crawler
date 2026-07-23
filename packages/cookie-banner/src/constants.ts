/**
 * Required translation namespaces for the cookie banner package
 */
const REQUIRED_TRANSLATION_NAMESPACES = [
  "Feature.Tracking",
  "CommonUI.Controls",
];

const PRIVACY_POLICY_URL = "https://www.roblox.com/info/privacy";
const REQUEST_DATA_URL = "https://www.roblox.com/support";
const PRIVACY_POLICY_URL_PLACEHOLDER = "{privacyPolicyLink}";
const GOOGLE_ANALYTICS_URL =
  "https://marketingplatform.google.com/about/analytics/";
const GOOGLE_INC = "Google Inc.";
const GA_READ_MORE_URL =
  "https://support.google.com/analytics/answer/11397207";
const GA_READ_MORE_URL_PLACEHOLDER = "{googleAnalyticsLink}";
const GA_COMPANY_COLLECTION_LIST = [
  { label: "Label.DataCollected", content: "Description.DataCollected" },
  { label: "Label.DataSharing", content: "Description.DataSharing" },
  { label: "Label.DataRetention", content: "Description.DataRetention" },
  { label: "Label.DataUse", content: "Description.DataUse" },
  { label: "Label.DataStorage", content: "Description.Undisclosed" },
];

export {
  REQUIRED_TRANSLATION_NAMESPACES,
  PRIVACY_POLICY_URL,
  REQUEST_DATA_URL,
  PRIVACY_POLICY_URL_PLACEHOLDER,
  GOOGLE_ANALYTICS_URL,
  GOOGLE_INC,
  GA_COMPANY_COLLECTION_LIST,
  GA_READ_MORE_URL,
  GA_READ_MORE_URL_PLACEHOLDER,
};
