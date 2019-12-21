/**
 * - user is supe object user
 */
export type User = {
  /**
   * age: nmer till deth
   */
  age: number;
  name: string;
};
/**
 * - Now we can use User as a proper type
 */
export interface CreateUser {
  (user: User): Promise<string>;
}
