import { counterUsers, type CounterUser, type InsertCounterUser } from "@shared/schema";
import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Counter User Methods
  getCounterUser(id: string): Promise<CounterUser | undefined>;
  getCounterUsers(): Promise<CounterUser[]>;
  createCounterUser(user: InsertCounterUser): Promise<CounterUser>;
  updateCounterUserCount(id: string, count: number): Promise<CounterUser | undefined>;
  updateCounterUserName(id: string, name: string): Promise<CounterUser | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private counterUsers: Map<string, CounterUser>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.counterUsers = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Counter User Methods
  async getCounterUser(id: string): Promise<CounterUser | undefined> {
    return this.counterUsers.get(id);
  }

  async getCounterUsers(): Promise<CounterUser[]> {
    return Array.from(this.counterUsers.values());
  }

  async createCounterUser(user: InsertCounterUser): Promise<CounterUser> {
    // Ensure count is set to a number (default to 0 if not provided)
    const counterUser: CounterUser = { 
      ...user,
      count: user.count ?? 0 
    };
    this.counterUsers.set(user.id, counterUser);
    return counterUser;
  }

  async updateCounterUserCount(id: string, count: number): Promise<CounterUser | undefined> {
    const user = await this.getCounterUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, count };
    this.counterUsers.set(id, updatedUser);
    return updatedUser;
  }

  async updateCounterUserName(id: string, name: string): Promise<CounterUser | undefined> {
    const user = await this.getCounterUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, name };
    this.counterUsers.set(id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
