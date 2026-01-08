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

export type TaskSlot = 'morning' | 'evening';

export type TaskDue = {
  taskType: TaskType;
  slot: TaskSlot;
  time: string;
};
