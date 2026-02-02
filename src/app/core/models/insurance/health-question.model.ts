export interface HealthQuestion {
  id?: string;
  applicationIdentifier: string;
  applicantIdentifier: string;
  coverageType: string;
  healthQuestionIdentifier: string;
  question: string;
  answer: string;
  coverageId?: string;
}

export interface HealthQuestionsSpDto {
  title: string
  index: number
  applicantSequence: number
  healthQuestionsDto: HealthQuestionDto[]
}

export interface HealthQuestionDto {
  applicantType: string;
  applicantSequence: number
  questionIdentifier: string;
  autoWaive: boolean;
  question: string;
  answer: boolean | null;
  disabled: boolean;
}

export const healthQuestionsInitialState = (): HealthQuestionDto[] => ([
  {
    applicantType: '',
    applicantSequence: 0,
    questionIdentifier: '',
    autoWaive: false,
    question: '',
    answer: null,
    disabled: false,
  }
])