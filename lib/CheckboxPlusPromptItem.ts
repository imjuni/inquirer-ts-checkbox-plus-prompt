import { Answers } from 'inquirer';
import Choice from 'inquirer/lib/objects/choice';

export type CheckboxPlusPromptItem<T extends Answers = any> = Choice<T> | string;
