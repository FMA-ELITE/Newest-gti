
export enum AcademicLevel {
  FOUNDATION = 'Foundation',
  UNDERGRADUATE = 'Undergraduate',
  GRADUATE = 'Graduate',
  MASTERS = 'Masters'
}

export interface Course {
  id: string;
  title: string;
  level: AcademicLevel;
  credits: number;
  instructor: string;
  department: string;
  description: string;
  syllabus: string[];
  learningOutcomes: string[]; 
  readingList: string[];
  image: string;
  visualPrompt?: string; 
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  type: 'Research Paper' | 'Textbook' | 'Institutional Journal' | 'White Paper';
  topic: string;
  year: number;
  description: string;
  coverImage: string;
  visualPrompt?: string;
  pdfUrl?: string; 
}

export interface ResearchMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface ResearchProject {
  id: string;
  name: string;
  group: string;
  topic: string;
  messages: ResearchMessage[];
  createdAt: string;
  updatedAt: string;
  moodBoardUrl?: string;
}

export interface Faculty {
  name: string;
  title: string;
  expertise: string;
  bio: string;
  professionalHistory: string[];
  keyPublications: string[];
  image: string;
  officeHours: string;
  visualPrompt?: string;
}

export interface EnrollmentData {
  fullName: string;
  email: string;
  phone: string;
  intendedMajor: string;
  currentLevel: string;
  statementOfIntent: string;
  submissionDate: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: 'Market Alert' | 'Institutional' | 'Academic' | 'Research';
  summary: string;
  image: string;
  visualPrompt?: string;
}
