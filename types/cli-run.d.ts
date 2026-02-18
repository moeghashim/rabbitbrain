declare module "@/cli/run.mjs" {
  export function parseArgs(argv: string[]): {
    positional: string[];
    flags: Record<string, string | boolean>;
  };

  export function runCli(
    argv: string[],
    options?: {
      analyzePostFn?: (args: { xUrl: string }) => Promise<unknown>;
      discoverTopicFn?: (args: { topic: string }) => Promise<unknown>;
      saveAnalysisFn?: (args: unknown) => Promise<string>;
      saveAnalysisLocalFn?: (args: unknown) => Promise<string>;
      env?: Partial<NodeJS.ProcessEnv>;
      writeStdout?: (content: string) => void;
      writeStderr?: (content: string) => void;
      readPackageJson?: () => { version?: string };
    },
  ): Promise<number>;
}
