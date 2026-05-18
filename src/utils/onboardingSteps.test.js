import { describe, it, expect } from 'vitest';
import { buildOnboardingSteps } from './onboardingSteps';

describe('buildOnboardingSteps', () => {
  it('native cliente: sin userType ni phone', () => {
    expect(buildOnboardingSteps('cliente', false)).toEqual([
      'welcome',
      'terms',
      'photo',
      'profile',
      'done',
    ]);
  });

  it('native trabajador: skills y rates', () => {
    expect(buildOnboardingSteps('trabajador', false)).toEqual([
      'welcome',
      'terms',
      'photo',
      'profile',
      'skills',
      'rates',
      'done',
    ]);
  });

  it('OAuth cliente: userType y phone', () => {
    expect(buildOnboardingSteps('cliente', true)).toEqual([
      'welcome',
      'terms',
      'userType',
      'photo',
      'phone',
      'profile',
      'done',
    ]);
  });

  it('OAuth trabajador: flujo completo', () => {
    expect(buildOnboardingSteps('trabajador', true)).toEqual([
      'welcome',
      'terms',
      'userType',
      'photo',
      'phone',
      'profile',
      'skills',
      'rates',
      'done',
    ]);
  });
});
