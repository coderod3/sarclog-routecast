import type { ReactNode } from 'react';
import {
  FaExclamationTriangle,
  FaShieldAlt,
  FaSkullCrossbones
} from 'react-icons/fa';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface RiskConfig {
  level: RiskLevel;
  icon: ReactNode;
  // Só as chaves de tradução: o texto vem sempre do locale ativo.
  textKey: string;
  descriptionKey: string;
  colorClass: string;
  backgroundClass: string;
  borderClass: string;
  progressClass: string;
  hexColor: string;
}

const LOW_RISK_CONFIG: RiskConfig = {
  level: 'Low',
  icon: (
    <FaShieldAlt className="text-xl text-green-500" />
  ),
  textKey: 'risk.low',
  descriptionKey: 'risk.lowDesc',
  colorClass: 'text-green-600',
  backgroundClass: 'bg-green-100',
  borderClass: 'border-green-500',
  progressClass: 'bg-green-500',
  hexColor: '#22c55e'
};

const MODERATE_RISK_CONFIG: RiskConfig = {
  level: 'Moderate',
  icon: (
    <FaExclamationTriangle className="text-xl text-yellow-500" />
  ),
  textKey: 'risk.moderate',
  descriptionKey: 'risk.moderateDesc',
  colorClass: 'text-yellow-600',
  backgroundClass: 'bg-yellow-100',
  borderClass: 'border-yellow-500',
  progressClass: 'bg-yellow-500',
  hexColor: '#eab308'
};

const HIGH_RISK_CONFIG: RiskConfig = {
  level: 'High',
  icon: (
    <FaSkullCrossbones className="text-xl text-red-500" />
  ),
  textKey: 'risk.high',
  descriptionKey: 'risk.highDesc',
  colorClass: 'text-red-600',
  backgroundClass: 'bg-red-100',
  borderClass: 'border-red-500',
  progressClass: 'bg-red-500',
  hexColor: '#ef4444'
};

export const normalizeRiskScore = (
  score: number
): number => {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(10, Math.max(0, score));
};

export const getRiskLevel = (
  score: number
): RiskLevel => {
  const normalizedScore = normalizeRiskScore(score);

  if (normalizedScore <= 3) {
    return 'Low';
  }

  if (normalizedScore <= 6) {
    return 'Moderate';
  }

  return 'High';
};

export const getRiskSeverityConfig = (
  score: number
): RiskConfig => {
  const riskLevel = getRiskLevel(score);

  return getRiskSeverityConfigByLevel(riskLevel);
};

export const getRiskSeverityConfigByLevel = (
  riskLevel: RiskLevel
): RiskConfig => {
  switch (riskLevel) {
    case 'High':
      return HIGH_RISK_CONFIG;

    case 'Moderate':
      return MODERATE_RISK_CONFIG;

    case 'Low':
    default:
      return LOW_RISK_CONFIG;
  }
};