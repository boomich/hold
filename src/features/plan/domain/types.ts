export type TaskType = 'NIZORAL_WASH' | 'NIZORAL_LATHER' | 'TERBINAFINE';

export type Plan = {
  startDate: string;
  nizoralDaysOfWeek: number[];
  eveningTime: string;
  morningTime: string;
  terbinafineEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  taskType: TaskType;
  label: string;
  timeOfDay: 'morning' | 'evening' | 'any';
  scheduledTime?: string;
};
