const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  firstTime?: boolean;
  error?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  mobile?: string;
  location?: {
    lat: number;
    lng: number;
    place_id: string;
  };
  address?: string;
  password?: string;
}

class AuthServiceClass {
  async sendOtp(contact: string): Promise<{ success: boolean; maskedContact?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          maskedContact: data.maskedContact,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to send OTP',
        };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async verifyOtp(contact: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          token: data.token,
          user: data.user,
          firstTime: data.firstTime,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to verify OTP',
        };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async login(contact: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          token: data.token,
          user: data.user,
          firstTime: data.firstTime,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          token: result.token,
          user: result.user,
          firstTime: result.firstTime,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async getMe(token: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          user: data.user,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch user data',
        };
      }
    } catch (error) {
      console.error('Get me error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async completeOnboarding(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to complete onboarding',
        };
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }
}

export const AuthService = new AuthServiceClass();