/**
 * Pasos del wizard de onboarding.
 * OAuth: userType + phone antes del perfil.
 */
export function buildOnboardingSteps(tipoUsuario, isOAuth) {
  const userTypeStep = isOAuth ? ['userType'] : [];
  const phoneStep = isOAuth ? ['phone'] : [];
  if (tipoUsuario === 'trabajador') {
    return ['welcome', 'terms', ...userTypeStep, 'photo', ...phoneStep, 'profile', 'skills', 'rates', 'done'];
  }
  return ['welcome', 'terms', ...userTypeStep, 'photo', ...phoneStep, 'profile', 'done'];
}
