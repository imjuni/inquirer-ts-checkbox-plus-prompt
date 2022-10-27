/* eslint-disable no-param-reassign */
import chalk from 'chalk';
import cliCursor from 'cli-cursor';
import figures from 'figures';
import inquirer, { Answers, Question } from 'inquirer';
import Choice from 'inquirer/lib/objects/choice';
import Choices from 'inquirer/lib/objects/choices';
import Base from 'inquirer/lib/prompts/base';
import observe from 'inquirer/lib/utils/events';
import Paginator from 'inquirer/lib/utils/paginator';
import { Interface as ReadLineInterface } from 'readline';
import { map, takeUntil } from 'rxjs/operators';
import CheckboxPlusPromptOptions from './CheckboxPlusPromptOptions';

export default class CheckboxPlusPrompt<TAnswers extends Answers = Answers> extends Base<
  CheckboxPlusPromptOptions & { states: any }
> {
  private pointer: number = 0;

  private paginator: Paginator;

  private firstSourceLoading: boolean;

  private choices: Choices;

  private checkedChoices: Choice<TAnswers>[];

  private searching: boolean;

  private selection: string[];

  private lastQuery?: string;

  private default?: string[];

  private value: any;

  private lastSourcePromise?: ReturnType<CheckboxPlusPromptOptions['source']>;

  private done?: (status?: inquirer.prompts.PromptState) => any | void;

  /**
   * Initialize the prompt
   *
   * @param  {Object} questions
   * @param  {Object} rl
   * @param  {Object} answers
   */
  constructor(
    questions: Question & CheckboxPlusPromptOptions & { states: any },
    rl: ReadLineInterface,
    answers: Answers,
  ) {
    super(questions, rl, answers);

    // Default value for the highlight option
    if (this.opt.highlight == null) {
      this.opt.highlight = false;
    }

    // Default value for the searchable option
    if (typeof this.opt.searchable == null) {
      this.opt.searchable = false;
    }

    // Default value for the default option
    if (typeof this.opt.default == null) {
      this.opt.default = undefined;
    }

    // Doesn't have source option
    if (this.opt.source == null) {
      this.throwParamError('source');
    }

    // Init
    this.pointer = 0;
    this.firstSourceLoading = true;
    this.choices = new Choices([], answers);
    this.checkedChoices = [];
    this.value = [];
    this.lastQuery = undefined;
    this.searching = false;
    this.lastSourcePromise = undefined;
    this.default = this.opt.default;
    this.opt.default = undefined;
    this.selection = [];
    this.done = undefined;

    this.paginator = new Paginator(this.screen);
  }

  /**
   * Start the Inquiry session
   *
   * @param  {Function} callback callback when prompt is done
   * @return {this}
   */
  _run(callback: CheckboxPlusPrompt<TAnswers>['done']) {
    this.done = callback;

    this.executeSource().then(() => {
      const events = observe(this.rl);

      const validation = this.handleSubmitEvents(
        events.line.pipe(map(this.getCurrentValue.bind(this))),
      );

      validation.success.forEach(this.onEnd.bind(this));
      validation.error.forEach(this.onError.bind(this));

      events.normalizedUpKey.pipe(takeUntil(validation.success)).forEach(this.onUpKey.bind(this));
      events.normalizedDownKey
        .pipe(takeUntil(validation.success))
        .forEach(this.onDownKey.bind(this));
      events.spaceKey.pipe(takeUntil(validation.success)).forEach(this.onSpaceKey.bind(this));

      // If the search is enabled
      if (this.opt.searchable === false) {
        events.numberKey.pipe(takeUntil(validation.success)).forEach(this.onNumberKey.bind(this));
        events.aKey.pipe(takeUntil(validation.success)).forEach(this.onAllKey.bind(this));
        events.iKey.pipe(takeUntil(validation.success)).forEach(this.onInverseKey.bind(this));
      } else {
        events.keypress.pipe(takeUntil(validation.success)).forEach(this.onKeypress.bind(this));
      }

      if (this.rl.line) {
        this.onKeypress();
      }

      // Init the prompt
      cliCursor.hide();
      this.render();
    });

    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  getValue(choice: Choice<TAnswers> | inquirer.Separator) {
    if (choice.type === 'separator') {
      return undefined;
    }

    return choice.value;
  }

  /**
   * Execute the source function to get the choices and render them
   */
  executeSource() {
    let sourcePromise: ReturnType<CheckboxPlusPromptOptions['source']> | undefined;

    // Remove spaces
    // @ts-ignore
    this.rl.line = this.rl.line.trim();

    // Same last search query that already loaded
    if (this.rl.line === this.lastQuery) {
      return Promise.resolve(undefined);
    }

    // If the search is enabled
    if (this.opt.searchable) {
      sourcePromise = this.opt.source(this.answers, this.rl.line);
    } else {
      sourcePromise = this.opt.source(this.answers, undefined);
    }

    this.lastQuery = this.rl.line;
    this.lastSourcePromise = sourcePromise;
    this.searching = true;

    sourcePromise.then((choices) => {
      // Is not the last issued promise
      if (this.lastSourcePromise !== sourcePromise) {
        return;
      }

      // Reset the searching status
      this.searching = false;

      // Save the new choices
      this.choices = new Choices(choices, this.answers);

      // Foreach choice
      this.choices.forEach((choice) => {
        // Is the current choice included in the current checked choices
        if (this.value.some((eachValue: any) => this.getValue(choice) === eachValue)) {
          this.toggleChoice(choice as any, true);
        } else {
          this.toggleChoice(choice as any, false);
        }

        // The default is not applied yet
        if (this.default != null) {
          // Is the current choice included in the default values
          if (this.default.some((defaultValue) => this.getValue(choice) === defaultValue)) {
            this.toggleChoice(choice as any, true);
          }
        }
      });

      // Reset the pointer to select the first choice
      this.pointer = 0;
      this.render();
      this.default = undefined;
      this.firstSourceLoading = false;
    });

    return sourcePromise;
  }

  /**
   * Render the prompt
   *
   * @param  {Object} error
   */
  render(error?: Error): void {
    // Render question
    let message = this.getQuestion();
    let bottomContent = '';

    // Answered
    if (this.status === 'answered') {
      message += chalk.cyan(this.selection.join(', '));
      return this.screen.render(message, bottomContent);
    }

    // No search query is entered before
    if (this.firstSourceLoading) {
      // If the search is enabled
      if (this.opt.searchable) {
        message += `(Press ${chalk.cyan.bold(
          '<space>',
        )} to select, or type anything to filter the list)`;
      } else {
        message += `(Press ${chalk.cyan.bold('<space>')} to select, ${chalk.cyan.bold(
          '<a>',
        )} to toggle all, ${chalk.cyan.bold('<i>')} to invert selection)`;
      }
    }

    // If the search is enabled
    if (this.opt.searchable) {
      // Print the current search query
      message += this.rl.line;
    }

    // Searching mode
    if (this.searching) {
      message += `\n  ${chalk.cyan('Searching...')}`;

      // No choices
    } else if (!this.choices.length) {
      message += `\n  ${chalk.yellow('No results...')}`;

      // Has choices
    } else {
      const choicesStr = this.renderChoices(this.choices, this.pointer);
      const choice = this.choices.getChoice(this.pointer) as Choice<Answers>;
      const indexPosition = this.choices.indexOf(choice);

      message += `\n${this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize)}`;
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    return this.screen.render(message, bottomContent);
  }

  /**
   * A callback function for the event:
   * When the user press `Enter` key
   *
   * @param {Object} state
   */
  onEnd(
    state: inquirer.prompts.SuccessfulPromptStateData | inquirer.prompts.FailedPromptStateData,
  ) {
    this.status = 'answered';

    // Rerender prompt (and clean subline error)
    this.render();

    this.screen.done();
    cliCursor.show();
    this.done?.('value' in state ? state.value : undefined);
  }

  /**
   * A callback function for the event:
   * When something wrong happen
   *
   * @param {Object} state
   */
  onError(state) {
    this.render(state.isValid);
  }

  /**
   * Get the current values of the selected choices
   *
   * @return {Array}
   */
  getCurrentValue() {
    this.selection = this.checkedChoices.map((checkedChoice) => checkedChoice.short);
    const values = this.checkedChoices.map((checkedChoice) => checkedChoice.value);
    return values;
  }

  /**
   * A callback function for the event:
   * When the user press `Up` key
   */
  onUpKey() {
    const len = this.choices.realLength;
    this.pointer = this.pointer > 0 ? this.pointer - 1 : len - 1;
    this.render();
  }

  /**
   * A callback function for the event:
   * When the user press `Down` key
   */
  onDownKey() {
    const len = this.choices.realLength;
    this.pointer = this.pointer < len - 1 ? this.pointer + 1 : 0;
    this.render();
  }

  /**
   * A callback function for the event:
   * When the user press a number key
   */
  onNumberKey(input: any) {
    if (input <= this.choices.realLength) {
      this.pointer = input - 1;
      this.toggleChoice(this.choices.getChoice(this.pointer) as any);
    }

    this.render();
  }

  /**
   * A callback function for the event:
   * When the user press `Space` key
   */
  onSpaceKey() {
    // When called no results
    if (this.choices.getChoice(this.pointer) == null) {
      return;
    }

    this.toggleChoice(this.choices.getChoice(this.pointer) as any);
    this.render();
  }

  /**
   * A callback function for the event:
   * When the user press 'a' key
   */
  onAllKey() {
    const shouldBeChecked = Boolean(
      this.choices.find((choice) => {
        return choice.type !== 'separator' && !choice.checked;
      }),
    );

    this.choices.forEach((choice) => {
      if (choice.type !== 'separator') {
        choice.checked = shouldBeChecked;
      }

      return choice;
    });

    this.render();
  }

  /**
   * A callback function for the event:
   * When the user press `i` key
   */
  onInverseKey() {
    this.choices.forEach((choice) => {
      if (choice.type !== 'separator') {
        choice.checked = !choice.checked;
      }
    });

    this.render();
  }

  /**
   * A callback function for the event:
   * When the user press any key
   */
  onKeypress() {
    this.executeSource();
    this.render();
  }

  /**
   * Toggle (check/uncheck) a specific choice
   *
   * @param nextChecked if not specified the status will be toggled
   * @param choice
   */
  toggleChoice(choice: Choice<Answers> | inquirer.Separator, nextChecked?: boolean) {
    if (choice.type === 'separator') {
      return;
    }

    // Default value for checked
    const checked = nextChecked == null ? !(choice.checked ?? false) : nextChecked;

    // Remove the choice's value from the checked values
    this.value = this.value.filter((eachValue: any) => eachValue !== choice.value);

    // Remove the checkedChoices with the value of the current choice
    this.checkedChoices = this.checkedChoices.filter(
      (checkedChoice) => checkedChoice.value !== choice.value,
    );

    choice.checked = false;

    // Is the choice checked
    if (checked === true) {
      this.value.push(choice.value);
      this.checkedChoices.push(choice as any);
      choice.checked = true;
    }
  }

  /**
   * Get the checkbox figure (sign)
   *
   * @param checked
   * @return checkbox figure
   */
  static getCheckboxFigure(checked: boolean = false): string {
    return checked ? chalk.green(figures.radioOn) : figures.radioOff;
  }

  /**
   * Render the checkbox choices
   *
   * @return rendered content
   */
  renderChoices(choices: Choices<TAnswers>, pointer: number): string {
    const output: string[] = [];
    let separatorOffset = 0;

    // Foreach choice
    choices.forEach((choice, index) => {
      // Is a separator
      if (choice.type === 'separator') {
        separatorOffset += 1;
        output.push(` ${choice}\n`);
        return;
      }

      // Is the choice disabled
      if (choice.disabled) {
        separatorOffset += 1;

        output.push(
          ` - ${choice.name} (${
            typeof choice.disabled === 'string' ? choice.disabled : 'Disabled'
          })\n`,
        );

        return;
      }

      // Is the current choice is the selected choice
      if (index - separatorOffset === pointer) {
        output.push(chalk.cyan(figures.pointer));
        output.push(CheckboxPlusPrompt.getCheckboxFigure(choice.checked));
        output.push(' ');
        output.push(this.opt.highlight ? chalk.gray(choice.name) : choice.name);
      } else {
        output.push(` ${CheckboxPlusPrompt.getCheckboxFigure(choice.checked)} ${choice.name}`);
      }

      output.push('\n');
    });

    return output.join('').replace(/\n$/, '');
  }
}
