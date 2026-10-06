// Single source of truth for CV content. Framework-free.
export interface Experience {
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface Education {
  degree: string;
  school: string;
  start: string;
  end: string;
  details: string;
}

export interface Highlight {
  title: string;
  description: string;
}

export interface Cv {
  name: string;
  headline: string;
  tagline: string;
  location: string;
  summary: string;
  experience: Experience[];
  skills: SkillGroup[];
  education: Education[];
  languages: string[];
  highlights: Highlight[];
}

export const CV: Cv = {
  name: 'Moris Maor Zakay',
  headline: 'Software Engineer · Full-Stack & AI Application Development',
  tagline: 'I build full-stack products and production agentic AI features, and write about what I learn along the way.',
  location: 'Upper Galilee, Israel (open to hybrid)',
  summary:
    'Software engineer with 5+ years building enterprise product features at BMC Software (Control-M), including designing and shipping agentic AI capabilities in production. Built LLM-powered features with Google ADK and LiteLLM on AWS Bedrock (Claude), and improved their cost, latency, and reliability through prompt engineering, multi-agent orchestration, and LLM evaluation pipelines. Full-stack across Angular/TypeScript and Python. Pursuing an M.Sc. in Computer Science (ML focus).',
  experience: [
    {
      role: 'Software Engineer (Product Developer)',
      company: 'BMC Software',
      location: 'Kiryat Shmona',
      start: '2021',
      end: 'Present',
      bullets: [
        'Designed and shipped agentic AI capabilities for enterprise customers, built with Google ADK and LiteLLM on AWS Bedrock (Claude); owned prompt design, tool and skill definitions, and streaming responses end to end.',
        'Significantly reduced token consumption, latency, and API cost through prompt optimization and sub-agent orchestration with isolated context.',
        'Built an LLM evaluation pipeline with LLM-as-judge scoring and RAG-based retrieval, improving response quality and catching regressions before release.',
        'Developed and maintained Angular 20+ features (Signals, RxJS, Nx) with Jest unit tests and Playwright e2e coverage, integrated with Python services via REST APIs.',
        'Containerized services with Docker and authored CI/CD pipelines in Jenkins and GitHub Actions, streamlining build and deployment.',
        'Owned features end to end with product and UX across global sites; wrote technical design docs, mentored and onboarded new developers, and served as a core code reviewer.',
      ],
    },
    {
      role: 'Software Developer Intern',
      company: 'Galcon',
      location: 'Kfar Blum',
      start: '2019',
      end: '2020',
      bullets: [
        'Built backend services in C# / .NET for hardware controllers using National Instruments (NI) SDKs.',
        'Extended the internal backend API layer used across product lines.',
      ],
    },
  ],
  skills: [
    { name: 'Languages', items: ['TypeScript / JavaScript', 'Python', 'Java', 'SQL'] },
    {
      name: 'AI / LLM',
      items: [
        'Agentic AI (Google ADK, LiteLLM)',
        'Claude via AWS Bedrock',
        'Prompt engineering',
        'Tool calling & agent skills',
        'Multi-agent orchestration',
        'RAG',
        'LLM evaluation (LLM-as-judge)',
        'Streaming responses',
        'Token/cost optimization',
      ],
    },
    {
      name: 'Frontend',
      items: ['Angular 20+ (standalone, Signals)', 'TypeScript', 'RxJS', 'Nx monorepo', 'SCSS', 'Bootstrap', 'Jest', 'Playwright'],
    },
    {
      name: 'DevOps / Cloud',
      items: ['Docker & docker-compose', 'Jenkins', 'GitHub Actions', 'AWS Bedrock', 'Git', 'GitHub', 'Bitbucket'],
    },
    {
      name: 'Practices',
      items: [
        'Agile/Scrum',
        'Code review',
        'Mentoring & onboarding',
        'Feature ownership',
        'Technical design docs',
        'Cross-site collaboration',
        'AI-assisted development (Claude Code, Cursor)',
      ],
    },
  ],
  education: [
    {
      degree: 'M.Sc. Computer Science',
      school: 'The Open University of Israel',
      start: '2023',
      end: 'Present',
      details:
        '38 credit points completed. Coursework: Algorithms for Massive Data, Data Mining, Image Processing, Brain-Inspired Computing Architectures, Advanced Topics in Algorithms, Research Seminar in Algorithms and Theory.',
    },
    {
      degree: 'B.Sc. Computer Science, GPA 87',
      school: 'Tel-Hai College',
      start: '2017',
      end: '2020',
      details:
        'Relevant coursework: Machine Learning & Pattern Recognition, Computer Vision, Computational Intelligence, Compilers, Signal Processing.',
    },
  ],
  languages: ['Hebrew (native)', 'English (fluent)'],
  highlights: [
    {
      title: 'Agentic AI in production',
      description: 'Designed and shipped production agentic AI capabilities with Google ADK and LiteLLM on AWS Bedrock (Claude).',
    },
    {
      title: 'Faster, cheaper LLM features',
      description: 'Cut token use, latency and API cost through prompt optimization and sub-agent orchestration with isolated context.',
    },
    {
      title: 'LLM evaluation pipeline',
      description: 'Built LLM-as-judge scoring with RAG-based retrieval to raise response quality and catch regressions before release.',
    },
  ],
};
