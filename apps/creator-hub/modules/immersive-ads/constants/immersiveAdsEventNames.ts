/**
 * Centralized event names for Immersive Ads analytics tracking
 *
 * This enum defines all analytics event names used throughout the immersive ads module
 * to ensure consistency and prevent typos in event tracking.
 */

enum ImmersiveAdsEventName {
  // RV Calculator Events
  RvCalculatorImpression = 'rvCalculatorImpression',
  RvCalculatorModalOpen = 'rvCalculatorModalOpen',
  RvCalculatorSliderChange = 'rvCalculatorSliderChange',
  RvCalculatorAdFormatChange = 'rvCalculatorAdFormatChange',
  RvCalculatorDocumentationClick = 'rvCalculatorDocumentationClick',
}

export default ImmersiveAdsEventName;
