
export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface RestorationStep {
  objective: string;
  prompt: string;
  status: StepStatus;
  beforeImage: string | null;
  afterImage: string | null;
}
