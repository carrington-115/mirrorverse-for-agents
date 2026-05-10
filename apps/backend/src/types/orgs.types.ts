type defaultApp = {
  name: string;
  description: string;
  category: string;
};

interface organization {
  creator: string;
  companyName: string;
  website: string;
  industry: string;
  companySize: number;
  defaultApps: defaultApp[];
  deploymentStrategies: defaultApp[];
}

export type { organization };
