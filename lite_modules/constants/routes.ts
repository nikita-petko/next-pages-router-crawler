// This file contains all the routes of the application
// PLEASE MAKE SURE TO UPDATE `/pages` FOLDER WITH THE NEW ROUTE WHEN EDITING THIS FILE
enum Routes {
  HOME = '/',
  CREATE_ACCOUNT = '/account/create/ad-account',
  EDIT_ACCOUNT = '/account/edit',
  ACCOUNT_OVERVIEW = '/account/overview',
  VERIFY_EMAIL = '/account/settings/verify-email',
  AD_INTEGRATIONS = '/ad-integrations',
  AD_INTEGRATIONS_CAMPAIGN = '/ad-integrations/[campaignId]',
  AD_INTEGRATIONS_CREATE = '/ad-integrations/create',
  AD_INTEGRATIONS_LANDING = '/ad-integrations/landing',
  CREATE_AD = '/add/ad',
  CREATE_ADSET = '/add/adset',
  ADD_PAYMENT = '/billing/addpaymentmethod',
  PAYMENT_ACTIVITY = '/billing/paymentactivity',
  PAYMENT_SETTINGS = '/billing/paymentsettings',
  CLASSIC = '/classic',
  NEW_CREATE_CAMPAIGN = '/create',
  CREATIVE_LIBRARY = '/creative-library',
  EDIT_CAMPAIGN = '/edit',
  IMPERSONATE = '/impersonate/[adAccountId]',
  LANDING = '/landing',
  MANAGE = '/manage',
  CREATE_CAMPAIGN = '/new/campaign',
}

export default Routes;
