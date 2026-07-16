export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    commission: 0,
    features: [],
  },
  beginner: {
    name: 'Beginner',
    price: 10, //100
    commission: 0.05,
    maxProducts: 10,
  },
  intermediate: {
    name: 'Intermediate',
    price: 25, //287
    commission: 0.03,
    maxProducts: 50,
  },
  advanced: {
    name: 'Advanced',
    price: 60, //690
    commission: 0.01,
    maxProducts: -1,
  },
} as const;
