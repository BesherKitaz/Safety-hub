type TrainingNodeSummary = {
  id: string;
  name?: string | null;
  type?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  lab?: LabSummary | null;
  labId?: string | null;
  tool?: ToolSummary | null;
  toolId?: string | null;
  parentNodes?: TrainingNodeSummary[] | null;
  childNodes?: TrainingNodeSummary[] | null;
  parents?: TrainingNodeSummary[] | null;
  children?: TrainingNodeSummary[] | null;
  parentTrainingNodes?: TrainingNodeSummary[] | null;
  childTrainingNodes?: TrainingNodeSummary[] | null;
};


type LabDetail = {
  id: string;
  name?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isActive?: boolean | null;
  tools?: LabTool[] | null;
  trainingNodes?: TrainingNodeSummary[] | null;
};


type LabSummary = {
  id: string;
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
};

type LabTool = {
  id: string;
  name?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isActive?: boolean | null;
  lab?: LabSummary | null;
  labId?: string | null;
  trainingNode?: ToolSummary | null;
  trainingNodeId?: string | null;
};

type ToolSummary = {
  id: string;
  name?: string | null;
  isActive?: boolean | null;
};

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  accent: string;
};

type TrainingsTabProps = {
  lab: LabDetail;
  trainingNodes: TrainingNodeSummary[];
};

type TrainingCardProps = {
  trainingNode: TrainingNodeSummary;
  currentLab: LabDetail;
};

type LabInfoTabProps = {
  lab: LabDetail;
  tools: LabTool[];
  trainingNodes: TrainingNodeSummary[];
  onLabUpdated: () => void | Promise<void>;
};

export type { 
  LabTool,  
  LabSummary, 
  LabDetail, 
  SectionHeaderProps, 
  ToolSummary, 
  TrainingNodeSummary, 
  TrainingsTabProps,
  TrainingCardProps,
  LabInfoTabProps,
}; 
