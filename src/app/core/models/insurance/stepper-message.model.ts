export enum MessageType {
  WARNING = 'warning',
  INFO = 'info',
  ERROR = 'error',
}

export interface StepperMessage {
  message: string;
  type: MessageType;
  showIt: boolean;
  time?: number;
}

export const initialMessageState = (): StepperMessage => ({
  message: '',
  type: MessageType.INFO,
  showIt: false,
  time: 0,
});
