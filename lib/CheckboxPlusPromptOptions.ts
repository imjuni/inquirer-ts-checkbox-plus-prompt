import { Answers, Question } from 'inquirer';

export type CheckboxPlusPromptOptions<T extends Answers = any> = Question<T> & {
  highlight?: boolean;
  searchable?: boolean;
  defaults?: string[];
  pageSize: number;
  source: (answersSoFar: Answers, input: string | undefined) => Promise<any[]>;
};

declare module 'inquirer' {
  interface QuestionMap<T> {
    checkboxPlus: Omit<CheckboxPlusPromptOptions<T>, 'type'> & { type: 'checkbox-plus' };
  }
}
