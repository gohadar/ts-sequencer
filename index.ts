type SequenceItem<
  Input extends unknown | never = void,
  Output extends unknown | never = void,
> = {
  timeout: number;
  callback: (input: Input) => Output | Promise<Output>;
};

type LastElementOf<T extends readonly unknown[]> = T extends readonly [
  ...unknown[],
  infer Last,
]
  ? Last
  : never;

/**
 * Delay a number of milliseconds.
 * @param milliseconds - The number of milliseconds to delay.
 */
const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export class Sequence<SequenceType extends SequenceItem<any, any>[] = never[]> {
  sequence: SequenceType;

  constructor(sequence?: SequenceType) {
    this.sequence = sequence ?? ([] as unknown as SequenceType);
  }

  /**
   * Add a new item to the sequence.
   * @param timeout - The time to wait before running the callback.
   * @param callback - The callback to run.
   */
  after<
    Input extends unknown = LastElementOf<SequenceType> extends SequenceItem<
      infer LastInput,
      infer LastOutput
    >
      ? Awaited<ReturnType<SequenceItem<LastInput, LastOutput>["callback"]>>
      : void,
    Output extends unknown = void,
  >(
    timeout: SequenceItem["timeout"],
    callback: SequenceItem<Input, Output>["callback"],
  ) {
    this.sequence.push({ timeout, callback });

    return this as unknown as Sequence<
      LastElementOf<SequenceType> extends never
        ? [SequenceItem<void, Output>]
        : [...SequenceType, SequenceItem<Input, Output>]
    >;
  }

  /**
   * Run the sequence.
   */
  async run<
    Output extends unknown = LastElementOf<SequenceType> extends SequenceItem<
      infer LastInput,
      infer LastOutput
    >
      ? Awaited<ReturnType<SequenceItem<LastInput, LastOutput>["callback"]>>
      : void,
  >() {
    return (await this.sequence.reduce(async (result, item: SequenceItem) => {
      const awaitedResult = await result;
      await delay(item.timeout);

      return item.callback(awaitedResult);
    }, Promise.resolve())) as Output;
  }

  /**
   * Repeat the sequence a number of times.
   * @param times - The number of times to repeat the sequence.
   */
  async repeat(times: number) {
    return Array.from({ length: times }).reduce(async (accumulator) => {
      await accumulator;
      return this.run();
    }, Promise.resolve());
  }
}
