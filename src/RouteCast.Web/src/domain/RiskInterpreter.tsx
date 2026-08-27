import React from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaSkullCrossbones } from 'react-icons/fa';

export interface RiskConfig {
  icon: React.ReactNode;
  textKey: string;
  colorClass: string;
  descriptionKey: string;
  hexColor: string;
}

/**
 * Interpreta a nota de risco (Score) do RouteCast e retorna todas as propriedades 
 */
export const getRiskSeverityConfig = (score: number): RiskConfig => {
  // Risco Alto (0 a 4)
  if (score <= 4) {
    return {
      icon: <FaSkullCrossbones className="text-red-500 text-xl" />,
      textKey: 'risk.high',
      colorClass: 'text-red-500',
      descriptionKey: 'risk.highDesc',
      hexColor: '#ef4444'
    };
  }
  
  // Risco Moderado (5 a 7)
  if (score <= 7) {
    return {
      icon: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
      textKey: 'risk.moderate',
      colorClass: 'text-yellow-500',
      descriptionKey: 'risk.moderateDesc',
      hexColor: '#facc15'
    };
  }
  
  // Risco Baixo (8 a 10)
  return {
    icon: <FaShieldAlt className="text-green-500 text-xl" />,
    textKey: 'risk.low',
    colorClass: 'text-green-500',
    descriptionKey: 'risk.lowDesc',
    hexColor: '#22c55e'
  };
};