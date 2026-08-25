const getConfigureSubscriptionLink = (universeId: string | number, subscriptionId: string) =>
  `/dashboard/creations/experiences/${universeId}/experience-subscriptions/EXP-${subscriptionId}/configure` as const;

export default getConfigureSubscriptionLink;
