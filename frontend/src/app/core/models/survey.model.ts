export type QuestionType = 'Q' | 'M' | 'T';

export type QuizStatusType = 'UNPUBLISHED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'ENDED';

export interface OptionItem {
  optionName: string;
  code: number;
}

export interface QuestionSave {
  questId?: number;
  questName: string;
  type: QuestionType;
  need: boolean;
  options?: OptionItem[];
}

export interface QuizListItem {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  status: QuizStatusType;
  statusLabel: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canViewStats?: boolean;
  canFill?: boolean;
}

export interface QuizDetail {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  status: QuizStatusType;
  statusLabel: string;
  questions: QuestionSave[];
}

export interface QuizSaveRequest {
  id?: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  questions: QuestionSave[];
}

export interface AnswerSubmit {
  questionId: number;
  answer: string;
}

export interface ResponseSubmit {
  quizId?: number;
  respondentName: string;
  phone: string;
  email: string;
  age?: number;
  answers: AnswerSubmit[];
}

export interface OptionStat {
  label: string;
  count: number;
  percentage: number;
}

export interface TextAnswer {
  answer: string;
  count: number;
}

export interface QuestionStat {
  questionId: number;
  title: string;
  type: QuestionType;
  isRequired: boolean;
  totalAnswers: number;
  options?: OptionStat[];
  textAnswers?: TextAnswer[];
  chartType?: 'pie' | 'bar'; // Local toggle state
}

export interface QuizStatistics {
  quizId: number;
  quizName: string;
  description: string;
  totalResponses: number;
  questions: QuestionStat[];
}

export interface QuizResponseItem {
  id: number;
  respondentName: string;
  submittedAt: string;
}

export interface QuestionAnswerDetail {
  questionId: number;
  title: string;
  type: QuestionType;
  isRequired: boolean;
  answer: string;
}

export interface QuizResponseDetail {
  responseId: number;
  quizId: number;
  quizName: string;
  quizDescription: string;
  startDate: string;
  endDate: string;
  respondentName: string;
  phone: string;
  email: string;
  age?: number;
  submittedAt: string;
  answers: QuestionAnswerDetail[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
