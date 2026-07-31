export const BYPASS_EMAIL_VERIFICATION =
  import.meta.env.BYPASS_EMAIL_VERIFICATION?.trim().toLowerCase() === "true";

export const BYPASS_PURDUE_EMAIL_REQUIREMENT =
  import.meta.env.BYPASS_PURDUE_EMAIL_REQUIREMENT?.trim().toLowerCase() === "true";

export const isPurdueEmail = (email: string) =>
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@purdue\.edu$/i.test(email.trim());

export const requiresPurdueEmail = () => !BYPASS_PURDUE_EMAIL_REQUIREMENT;
