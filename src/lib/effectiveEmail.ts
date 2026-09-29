/**
 * Holds the effective email for data queries.
 * Set by userSlice when the user is loaded.
 * - Sub-admins: set to the main admin's email (invitedBy)
 * - Everyone else: set to their own email
 */
let _effectiveEmail = "";

export const setEffectiveEmail = (email: string) => {
  _effectiveEmail = email;
};

export const getEffectiveEmail = (): string => _effectiveEmail;
