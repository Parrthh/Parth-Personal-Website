// All site content lives here. Edit this file to update the website.

export const profile = {
  name: "Parth Kharkar",
  firstName: "Parth",
  lastName: "Kharkar",
  role: "Software Engineer",
  focus: "AI and Data Systems",
  location: "New Jersey, open to relocation",
  status: "Open to new opportunities",
  email: "parthkharkar18@gmail.com",
  github: "https://github.com/Parrthh",
  linkedin: "https://www.linkedin.com/in/parrthhkharkar",
  intro:
    "I build backend systems, data pipelines, and AI features that keep working after the demo. Right now I'm at Rutgers, shipping AI applications for health research teams.",
};

export const about = {
  statement:
    "I care about the unglamorous part of AI and data work: getting messy inputs into reliable shape, and proving the output is right.",
  paragraphs: [
    "I'm a software engineer with two years of professional experience across the stack, from React interfaces and Node.js APIs to AWS data pipelines and LLM integrations.",
    "At Rutgers I'm the primary technical contributor for a health research group. I've built a cross-platform AI coaching app, a multimodal grading system for clinical exams, and the evaluation tooling that measures whether generated output can be trusted.",
  ],
};

export const stats = [
  { value: "2+", label: "years building production software" },
  { value: "99.2%", label: "completeness on AI-generated plans in SATHI" },
  { value: "70%", label: "faster API responses at The Daily Targum" },
  { value: "3.9", label: "GPA, M.S. Computer Engineering" },
];

export const experience = [
  {
    company: "Institute for Health, Health Care Policy and Aging Research",
    org: "Rutgers University",
    role: "Software Engineer",
    period: "Oct 2024 to Present",
    points: [
      "Built SATHI, a cross-platform AI app on AWS (React Native and Expo, Node.js, MongoDB, Amazon Bedrock) that generates personalized plans from structured user data.",
      "Created an automated evaluation suite that checks schema compliance, completeness, grounding, safety, and consistency, reaching 100% schema validity and 99.2% completeness.",
      "Engineered a reusable multimodal system that turns clinical exam audio, video, and transcripts into standardized, rubric-based grades.",
      "Rolled out a department-wide audit workflow that gives scientific and analytics teams one traceable history of document versions and edits.",
      "Built reproducible R pipelines on UK Biobank and OpenGWAS data that surfaced methodological issues affecting earlier findings.",
    ],
    stack: ["AWS", "Amazon Bedrock", "React Native", "Node.js", "MongoDB", "R"],
  },
  {
    company: "The Daily Targum",
    org: "Rutgers University",
    role: "Full Stack Developer",
    period: "Jul 2023 to May 2024",
    points: [
      "Built React and TypeScript editorial tools, Node.js APIs, and MySQL schemas for a multi-tenant CMS used by 50+ contributors and handling about 10K API requests a day.",
      "Cut database load by 60% and endpoint response times by 70% with Redis caching, query tuning, and indexing.",
      "Automated releases with GitHub Actions, halving release cycle time and removing manual deploy steps.",
    ],
    stack: ["React", "TypeScript", "Node.js", "MySQL", "Redis", "GitHub Actions"],
  },
];

export type Featured = {
  title: string;
  category: string;
  year: string;
  badge?: string;
  summary: string;
  points: string[];
  stack: string[];
};

export const featured: Featured[] = [
  {
    title: "Customer Subscription Analytics Pipeline",
    category: "Data Engineering",
    year: "2025",
    summary:
      "An ETL pipeline on AWS that unifies 100K+ simulated customer records so churn and revenue questions get answered quickly.",
    points: [
      "Glue jobs land data in S3 and Redshift as a single source of truth",
      "Spark on EMR with Hive tables cut processing time by 40%",
      "QuickSight dashboards for churn, ARPU, LTV, and subscription growth",
    ],
    stack: ["AWS Glue", "S3", "Redshift", "EMR", "Spark", "QuickSight"],
  },
  {
    title: "Pathfinder Learning Management System",
    category: "Full Stack",
    year: "2024",
    summary:
      "A learning platform with role-based dashboards for students, instructors, and administrators.",
    points: [
      "Role-based dashboards cut navigation time by 40%",
      "Docker and CI/CD pipelines for automated deployments",
      "Led the team and owned the architecture",
    ],
    stack: ["React", "Node.js", "MySQL", "Docker", "CI/CD"],
  },
  {
    title: "Real-Time Stock Data Analysis",
    category: "Data Engineering",
    year: "2023",
    summary:
      "A fully serverless pipeline for processing and querying decades of FANGMANT stock data.",
    points: [
      "Serverless ETL with Glue and Lambda, nothing to keep running",
      "Tuned Athena queries over multi-decade history",
      "QuickSight dashboards for trend analysis",
    ],
    stack: ["AWS Glue", "Lambda", "Athena", "QuickSight", "S3"],
  },
  {
    title: "Surface Crack Classification with CNN",
    category: "AI / ML Research",
    year: "2022",
    badge: "Published",
    summary:
      "Research that classifies cracks in building surfaces and estimates their severity to assess structural integrity.",
    points: [
      "Published in Springer conference proceedings",
      "Pixel-analysis algorithm to measure crack width",
      "YOLOv5 model deployed in an Android app",
    ],
    stack: ["CNN", "YOLOv5", "Android", "Image Processing"],
  },
];

export const archive = [
  { year: "2023", title: "Pathfinding Algorithms Visualizer", note: "A*, Forward A*, and Adaptive A* with a statistical comparison", stack: "Python, Matplotlib" },
  { year: "2023", title: "Online Auction System", note: "Listings, automatic bidding, and transaction integrity", stack: "Java, JSP, SQL" },
  { year: "2022", title: "Urgent Care Management System", note: "Four-role healthcare app with protected medical history", stack: "React, Node.js, MySQL" },
  { year: "2022", title: "Account Management System", note: "Banking and stock accounts built on OOP inheritance", stack: "C++" },
  { year: "2021", title: "COVID-19 Chest X-Ray Classification", note: "CNN with CLAHE preprocessing across three classes", stack: "CNN, Image Processing" },
];

export const building = [
  {
    title: "Agentic Research Platform",
    note: "Planner, retriever, tool executor, and verifier agents that answer research questions with checkable citations.",
    stack: ["LangGraph", "Amazon Bedrock", "pgvector"],
  },
  {
    title: "AI Incident Intelligence",
    note: "Incident triage that searches runbooks, logs, and past incidents to propose cited root causes.",
    stack: ["FastAPI", "PostgreSQL", "Bedrock"],
  },
  {
    title: "Real-Time ML Risk Detection",
    note: "An event-driven scoring service for streaming transactions with drift monitoring and human review.",
    stack: ["Kafka", "XGBoost", "GCP"],
  },
  {
    title: "Domain LLM Fine-Tuning",
    note: "Fine-tuning an open 7B model with QLoRA and serving it efficiently with vLLM.",
    stack: ["PyTorch", "QLoRA", "vLLM"],
  },
];

export const skills = [
  { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "SQL", "C++", "R"] },
  { group: "AI and ML", items: ["LLM Integration", "Amazon Bedrock", "RAG", "Multimodal AI", "AI Evaluation", "PyTorch", "scikit-learn", "XGBoost"] },
  { group: "Data", items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Spark", "AWS Glue", "Redshift", "Athena"] },
  { group: "Web and Mobile", items: ["React", "React Native", "Expo", "Node.js", "Express", "FastAPI"] },
  { group: "Cloud and DevOps", items: ["AWS", "GCP", "Docker", "GitHub Actions", "CI/CD", "Git"] },
];

export const education = [
  {
    school: "Rutgers, The State University of New Jersey",
    degree: "M.S. Computer Engineering, Software Engineering track",
    period: "2022 to 2024",
    detail: "GPA 3.9 / 4.0. Coursework in Cloud Computing and Big Data, Database Systems, Deep Learning, Software Engineering, and Algorithms.",
  },
  {
    school: "E&ICT Academy, IIT Roorkee",
    degree: "Artificial Intelligence and Machine Learning Certification",
    period: "2026 to Present",
    detail: "Ongoing program covering applied machine learning and deep learning.",
  },
  {
    school: "Springer Conference Proceedings",
    degree: "Publication: Classification of Surface Cracks and Their Severity using CNN",
    period: "2022",
    detail: "Crack detection and width estimation for structural integrity assessment.",
  },
];
