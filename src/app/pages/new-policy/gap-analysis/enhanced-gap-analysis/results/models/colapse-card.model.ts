import { COVERAGE_TYPE } from '@core/utils/enums/gap-analysis-constants';

export interface CollapseCard {
  coverageType: number;
  isCollapsed: boolean;
}

export const cardCollapseInitialState = (): CollapseCard[] => [
  {
    coverageType: COVERAGE_TYPE.LIFE,
    isCollapsed: true,
  },
  {
    coverageType: COVERAGE_TYPE.DISABILITY,
    isCollapsed: true,
  },
  {
    coverageType: COVERAGE_TYPE.JOB_LOSS,
    isCollapsed: true,
  },
  {
    coverageType: COVERAGE_TYPE.CRITICAL_ILLNESS,
    isCollapsed: true,
  },
];
