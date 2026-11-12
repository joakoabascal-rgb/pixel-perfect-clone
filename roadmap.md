# Visitor accounts
- [x] Add sign-in, registration, recovery, and session-aware navigation without profiles.
- [x] Enable email/password and Google without changing admin permissions.
- [ ] Enable Lovable sign-in: hosted account service reports COMING_UP; configuration refused.
- [ ] Enable visitor registration: existing signup restriction remains; current security settings cannot be read while hosted service is unavailable. User can disable “Disable signup” in More → Users → Auth settings without changing other settings.
- [x] Verify login error states, recovery invalid-link guard, signed-out editor redirect, mobile layout, and permission/cache tests (4 passed).
- [ ] Verify successful signup, confirmed sign-in, sign-out, and real visitor exclusion end-to-end: hosted service unavailable; session mint failed.