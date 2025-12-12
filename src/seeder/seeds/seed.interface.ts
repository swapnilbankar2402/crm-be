export interface Seed {
  name: string;
  run(): Promise<void>;
}