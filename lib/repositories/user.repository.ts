import { UserDbService } from '@/lib/services/user-db.service';
import { 
  UserData, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserListOptions,
  UserListResponse,
  userValidationSchema,
  updateUserValidationSchema
} from '@/lib/types/user';

export class UserRepository {
  private userDbService: UserDbService;

  constructor() {
    this.userDbService = new UserDbService();
  }

  /**
   * Get all users with filtering and pagination
   */
  async findAll(options: UserListOptions = {}): Promise<UserListResponse> {
    try {
      const result = await this.userDbService.findUsers(options);
      return {
        users: result.users,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      console.error('Error finding users:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * Get a single user by ID
   */
  async findById(id: string): Promise<UserData | null> {
    try {
      return await this.userDbService.findById(id);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserRequest, createdBy: string): Promise<UserData> {
    try {
      // Validate input data
      const validatedData = userValidationSchema.parse(data);

      // Create user (duplicate checking is handled in the service)
      const user = await this.userDbService.createUser(validatedData, createdBy);
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserRequest): Promise<UserData> {
    try {
      // Validate input data
      const validatedData = updateUserValidationSchema.parse(data);

      // Check if user exists
      const existingUser = await this.userDbService.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Update user (duplicate checking is handled in the service)
      const updatedUser = await this.userDbService.updateUser(id, validatedData);
      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await this.userDbService.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Prevent deletion of the last super admin
      if (existingUser.role === 'super-admin') {
        const allUsers = await this.userDbService.readUsers();
        const superAdmins = allUsers.filter(user => user.role === 'super-admin' && user.status === 'active');
        if (superAdmins.length <= 1) {
          throw new Error('Cannot delete the last super admin');
        }
      }

      await this.userDbService.deleteUser(id);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      return await this.userDbService.getUserStats();
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to retrieve user statistics');
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string, excludeId?: string): Promise<boolean> {
    try {
      return await this.userDbService.usernameExists(username, excludeId);
    } catch (error) {
      console.error('Error checking username existence:', error);
      throw new Error('Failed to check username availability');
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      return await this.userDbService.emailExists(email, excludeId);
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Failed to check email availability');
    }
  }

  /**
   * Get all users (for dropdowns, etc.)
   */
  async getAllUsers(): Promise<UserData[]> {
    try {
      return await this.userDbService.readUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to retrieve all users');
    }
  }
} 