
---
description: Fix BCV Live Data Display
---
// turbo-all

1. Modify `client/src/components/BCVView.jsx` to fetch live rates from `/api/rates` and use them for the main display instead of relying solely on the historical Excel data.
2. Ensure the "Current Rate" card reflects the official website values (approx 400.49 for EUR and 344.50 for USD).
