import { useContext, useState, useEffect } from 'react';
import { experienceSubscriptionsClient } from '@modules/clients';
import ExperienceSubscriptionsContext from '../ExperienceSubscriptionContext';

export default function useCurrentExperienceSubscription() {
  return useContext(ExperienceSubscriptionsContext);
}
