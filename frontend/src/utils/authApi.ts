const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
    id: number;
    email: string;
    name: string;
    created_at: string;
}

export interface UserCreate {
    email: string;
    name: string;
    password: string;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface PasswordUpdate {
    current_password: string;
    new_password: string;
}

export interface QueryHistoryItem {
    id: number;
    user_id: number;
    query: string;
    timestamp: string;
}

export const authApi = {
    /**
     * Register a new user
     */
    register: async (userData: UserCreate): Promise<{ success: boolean, user?: User, message?: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.detail || 'Registration failed' };
            }

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error during registration' };
        }
    },

    /**
     * Log in a user
     */
    login: async (credentials: UserLogin): Promise<{ success: boolean, user?: User, message?: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.detail || 'Login failed' };
            }

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error during login' };
        }
    },

    /**
     * Log out the current user
     */
    logout: async (): Promise<{ success: boolean }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            return { success: response.ok };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false };
        }
    },

    /**
     * Get the current authenticated user
     */
    getCurrentUser: async (): Promise<{ success: boolean, user?: User }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                credentials: 'include',
            });

            if (!response.ok) {
                return { success: false };
            }

            const data = await response.json();
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false };
        }
    },

    /**
     * Update the user's password
     */
    changePassword: async (passwordData: PasswordUpdate): Promise<{ success: boolean, message: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwordData),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.detail || 'Password change failed' };
            }

            return { success: true, message: data.message };
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Network error during password change' };
        }
    },

    /**
     * Delete the user's account
     */
    deleteAccount: async (): Promise<{ success: boolean, message: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/delete-account`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.detail || 'Account deletion failed' };
            }

            return { success: true, message: data.message };
        } catch (error) {
            console.error('Account deletion error:', error);
            return { success: false, message: 'Network error during account deletion' };
        }
    },

    /**
     * Get the user's query history
     */
    getQueryHistory: async (): Promise<{ success: boolean, queries?: QueryHistoryItem[], message?: string }> => {
        try {
            console.log("Requesting user query history from API...");
            const response = await fetch(`${API_URL}/api/user/queries`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to fetch query history:", errorData);
                return { success: false, message: errorData.detail || 'Failed to fetch query history' };
            }

            const data = await response.json();
            console.log(`Received ${data.queries?.length || 0} query history entries`);
            return { success: true, queries: data.queries };
        } catch (error) {
            console.error('Query history error:', error);
            return { success: false, message: 'Network error while fetching query history' };
        }
    },
}; 