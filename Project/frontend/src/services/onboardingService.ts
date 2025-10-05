const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export interface Asset {
  type: 'POLYHOUSE' | 'FERTIGATION';
  name?: string;
  macid: string;
}

export interface InviteUser {
  email?: string;
  mobile?: string;
  role: 'OWNER' | 'ADMIN' | 'FARM_MANAGER' | 'VIEWER';
  languagePref?: string;
}

class OnboardingServiceClass {
  async saveAssets(token: string, assets: Asset[]): Promise<{ success: boolean; error?: string; assets?: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assets }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          assets: data.assets,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to save assets',
        };
      }
    } catch (error) {
      console.error('Save assets error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async getUserAssets(token: string): Promise<{ success: boolean; error?: string; assets?: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/assets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          assets: data.assets,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch assets',
        };
      }
    } catch (error) {
      console.error('Get assets error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async inviteUser(token: string, userData: InviteUser): Promise<{ success: boolean; error?: string; invite?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/invite-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          invite: data.invite,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to send invite',
        };
      }
    } catch (error) {
      console.error('Invite user error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async getUserInvites(token: string): Promise<{ success: boolean; error?: string; invites?: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/invites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          invites: data.invites,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch invites',
        };
      }
    } catch (error) {
      console.error('Get invites error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async getInvite(token: string): Promise<{ success: boolean; error?: string; invite?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/invite/${token}`);

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          invite: data.invite,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch invite',
        };
      }
    } catch (error) {
      console.error('Get invite error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async acceptInvite(token: string, userData: { name: string; password: string }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/invite/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
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
          error: data.error || 'Failed to accept invite',
        };
      }
    } catch (error) {
      console.error('Accept invite error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }
}

export const OnboardingService = new OnboardingServiceClass();