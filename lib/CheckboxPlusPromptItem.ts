import { Answers } from 'inquirer';
import Choice from 'inquirer/lib/objects/choice';

type CheckboxPlusPromptItem<T extends Answers = any> = Choice<T> | string;

export default CheckboxPlusPromptItem;
