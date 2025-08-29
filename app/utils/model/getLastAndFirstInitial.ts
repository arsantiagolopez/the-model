export const getLastAndFirstInitial = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') return '';
  
  const nameParts = fullName.trim().split(' ');
  
  if (nameParts.length === 0) return '';
  if (nameParts.length === 1) return nameParts[0];
  
  // Get first initial and last name - format: "J. Doe"
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  return `${firstName.charAt(0)}. ${lastName}`;
};