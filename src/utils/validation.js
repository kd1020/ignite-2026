export function validateIndianMobile(rawMobile) {
  if (!rawMobile || typeof rawMobile !== 'string') {
    return { isValid: false, message: "Mobile number is required." };
  }

  const cleaned = rawMobile.replace(/[\s\-\(\)]/g, '');
  let normalized = cleaned;
  if (normalized.startsWith('+91')) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith('91') && normalized.length === 12)
{
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized.slice(1);
  }

  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(normalized)) {
    return {
      isValid: false,
      message: "Please enter a valid 10-digit Indian mobile number (starts with 6-9)."
    };
  }

  return { isValid: true, normalizedMobile: normalized };
}

export function validateRegistrationForm(formState) {
  const errors = {};

  if (!formState.teamName || formState.teamName.trim().length < 3) {
    errors.teamName = "Team Name must be at least 3 characters.";
  }

  if (!formState.leaderName || formState.leaderName.trim().length < 2)
{
    errors.leaderName = "Leader Name is required (minimum 2 characters).";
  }

  const mobileResult = validateIndianMobile(formState.leaderMobile);
  if (!mobileResult.isValid) {
    errors.leaderMobile = mobileResult.message;
  }

  const memberErrors = [];
  if (!Array.isArray(formState.members) || formState.members.length !== 3) {
    errors.members = "A fixed team of 4 members (1 leader + 3 squad members) is required.";
  } else {
    formState.members.forEach((member, index) => {
      if (!member || member.trim().length < 2) {
        memberErrors[index] = `Member #${index + 2} name is required (minimum 2 characters).`;
      }
    });
    if (memberErrors.length > 0) {
      errors.memberList = memberErrors;
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
