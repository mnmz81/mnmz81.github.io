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
  headline: 'Software Engineer · Angular & AI Agents',
  tagline: 'I build enterprise product features in Angular and production LLM agents in Python.',
  location: 'Gadot, Israel (open to hybrid)',
  summary:
    'Software engineer with 5+ years building enterprise product features at BMC Software (Control-M). My work splits between Angular frontend and production LLM agents in Python (Google ADK, LiteLLM, AWS Bedrock with Claude), where I make agents more accurate, faster, and cheaper through prompt engineering, multi-agent orchestration, and evaluation pipelines. I also fix bugs and ship new functionality in Java services. Pursuing an M.Sc. in Computer Science (ML focus).',
  experience: [
    {
      role: 'Software Engineer (Product Developer)',
      company: 'BMC Software',
      location: 'Kiryat Shmona',
      start: '2021',
      end: 'Present',
      bullets: [
        'Develop and maintain Angular 20+ product features (standalone components, Signals, RxJS, Nx monorepo) with Jest unit tests and Playwright e2e coverage.',
        'Build and continuously improve production LLM agents for enterprise customers in Python with Google ADK and LiteLLM on AWS Bedrock (Claude); own prompt design, tool and skill definitions, and streaming responses.',
        'Improved agent accuracy, latency, and token cost by refining prompts and splitting work across sub-agents with isolated context.',
        'Built an LLM evaluation pipeline (LLM-as-judge scoring, RAG-based retrieval) to measure answer quality and catch regressions before release.',
        'Fix bugs and deliver new functionality in Java backend services.',
        'Containerized services with Docker and maintain CI/CD pipelines in Jenkins and GitHub Actions.',
        'Own features end to end with product and UX across global sites; write technical design docs, mentor and onboard new developers, and serve as a core code reviewer.',
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
      items: ['Angular 20+ (standalone, Signals)', 'RxJS', 'Nx monorepo', 'SCSS', 'Bootstrap', 'Jest', 'Playwright'],
    },
    {
      name: 'DevOps / Tools',
      items: ['Docker & docker-compose', 'Jenkins', 'GitHub Actions', 'Git', 'GitHub', 'Bitbucket'],
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
      title: 'Angular product features',
      description: 'Enterprise UI in Angular 20+ with Signals, RxJS and Nx, covered by Jest unit tests and Playwright e2e.',
    },
    {
      title: 'LLM agents in production',
      description: 'Build and improve Python agents with Google ADK and LiteLLM on AWS Bedrock (Claude): prompts, tools, sub-agents.',
    },
    {
      title: 'LLM evaluation pipeline',
      description: 'LLM-as-judge scoring with RAG-based retrieval to measure agent quality and catch regressions before release.',
    },
  ],
};
