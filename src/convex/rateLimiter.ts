import {
  RateLimiter,
  MINUTE,
} from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  phoneOtp: {
    kind: "fixed window",
    rate: 3,
    period: MINUTE,
  },

  emailOtp: {
    kind: "fixed window",
    rate: 3,
    period: MINUTE,
  },

  login: {
    kind: "fixed window",
    rate: 5,
    period: MINUTE,
  },

  inquiry: {
    kind: "fixed window",
    rate: 5,
    period: MINUTE,
  },
    propertyCreate: {
    kind: "fixed window",
    rate: 5,
    period: 60 * MINUTE,
  },
    upload: {
    kind: "fixed window",
    rate: 20,
    period: 60 * MINUTE,
  },
    view: {
    kind: "fixed window",
    rate: 30,
    period: MINUTE,
  },
  propertyUpdate: {
  kind: "fixed window",
  rate: 10,
  period: MINUTE,
  
},
propertyDelete: {
  kind: "fixed window",
  rate: 10,
  period: MINUTE,
},
});