export type QuestionType = 'Q' | 'M' | 'T';

export type QuizStatusType = 'UNPUBLISHED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'ENDED';

/** Centralized display labels for QuestionType — replaces inline ternary chains. */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  Q: '單選',
  M: '多選',
  T: '文字',
};

export function getQuestionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_LABELS[type] ?? type;
}

/**
 * 只有單選題適合圓餅圖。多選題的百分比分母是「作答人數」，各項加總會超過 100%，
 * 畫成圓餅圖等於把不成比例的數字硬塞進一個圓，必然失真。
 */
export function canUsePieChart(type: QuestionType): boolean {
  return type === 'Q';
}

/** Authentication user payload — shared across auth service, guards, and components. */
export interface AuthUser {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  id: number;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  role: 'MEMBER' | 'ADMIN';
}

export interface OptionItem {
  optionName: string;
  code: number;
}

/** 編輯器 / 存檔請求用：尚未存進資料庫的新題目沒有 questId。 */
export interface QuestionDraft {
  questId?: number;
  questName: string;
  type: QuestionType;
  need: boolean;
  options?: OptionItem[];
}

/** 後端回傳的題目：questId 必定存在，所以讀取端不需要 `!` 斷言。 */
export interface Question extends QuestionDraft {
  questId: number;
}

export interface QuizListItem {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  adminStatusOverride?: QuizStatusType | null;
  status: QuizStatusType;
  statusLabel: string;
  canEdit?: boolean;
  canViewStats?: boolean;
  canFill?: boolean;
  ownerId?: number | null;
  ownerName?: string | null;
  responseCount: number;
}

export interface QuizDetail {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  adminStatusOverride?: QuizStatusType | null;
  status: QuizStatusType;
  statusLabel: string;
  questions: Question[];
}

export interface QuizSaveRequest {
  id?: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  questions: QuestionDraft[];
}

/** 選擇題送 optionCodes、文字題送 answer。舊的分號串接格式已移除。 */
export interface AnswerSubmit {
  questionId: number;
  answer?: string;
  optionCodes?: number[];
}

export interface ResponseSubmit {
  quizId?: number;
  respondentName: string;
  phone: string;
  email: string;
  age: number;
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
  optionCodes: number[];
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
  code?: string;
  message: string;
  data: T;
  fieldErrors?: Record<string, string>;
}
