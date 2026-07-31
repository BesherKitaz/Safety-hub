/// <reference types="node" />

const PURDUE_EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@purdue\.edu$/i;

const envFlag = (value: string | undefined) => value?.trim().toLowerCase() === 'true';

const isPurdueEmail = (email: string) => PURDUE_EMAIL_PATTERN.test(email.trim());

const isEmailVerificationBypassed = () => envFlag(process.env.BYPASS_EMAIL_VERIFICATION);

const isPurdueEmailRequirementBypassed = () => envFlag(process.env.BYPASS_PURDUE_EMAIL_REQUIREMENT);

export { isEmailVerificationBypassed, isPurdueEmail, isPurdueEmailRequirementBypassed };
