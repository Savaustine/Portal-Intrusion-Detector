const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface RegisterData {
  reg_number: string;
  full_name: string;
  password: string;
  username?: string;
  email?: string;
  role?: string;
}

export interface LoginData {
  reg_number?: string;
  username?: string;
  password: string;
}

export interface UserProfile {
  id?: number;
  reg_number: string;
  full_name: string;
  username?: string;
  email?: string | null;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: UserProfile;
}

export interface DashboardResponse {
  message: string;
  user: UserProfile;
  stats?: {
    courses_count: number;
    files_count: number;
    last_login: string;
  };
}

export interface GradeItem {
  id: number;
  student_id?: number;
  reg_number: string;
  student_name?: string;
  course_code: string;
  course_name: string;
  grade: string;
  credits: number;
  semester?: string;
  uploaded_by?: string;
  created_at?: string;
}

export interface GradeUploadData {
  reg_number: string;
  course_code: string;
  course_name: string;
  grade: string;
  credits: number;
  semester?: string;
}

export interface GradeUpdateData {
  course_code?: string;
  course_name?: string;
  grade?: string;
  credits?: number;
  semester?: string;
}

export interface StudentLookupResponse {
  found: boolean;
  id: number;
  reg_number: string;
  full_name: string;
  username?: string;
  email?: string;
  role: string;
}

export interface StudentListItem {
  id: number;
  reg_number: string;
  full_name: string;
  username?: string;
  email?: string;
  role?: string;
}

export interface FileItem {
  id: number;
  filename: string;
  course: string;
  size: string;
  uploaded_at: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface AlertItem {
  id: number;
  activity_id: number;
  student_id: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: string;
  acknowledged: boolean;
}

export interface ActivityLogItem {
  id: number;
  student_id: number;
  action: string;
  success: boolean;
  timestamp: string;
  classification: 'normal' | 'suspicious';
  confidence: number;
  details?: string | null;
}

export interface AdminStatsResponse {
  total_activities: number;
  suspicious_activities: number;
  normal_activities: number;
  total_alerts: number;
  unacknowledged_alerts: number;
  high_critical_alerts: number;
  avg_anomaly_confidence: number;
  ids_status: string;
  model_status: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      let message = `Request failed with status ${response.status}`;

      if (responseBody) {
        try {
          const errorData: any = JSON.parse(responseBody);
          if (typeof errorData.detail === 'string') {
            message = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            message = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
          } else if (typeof errorData.message === 'string') {
            message = errorData.message;
          }
        } catch {
          const plainText = responseBody.trim();
          if (plainText && !plainText.toLowerCase().includes('<!doctype html')) {
            message = plainText;
          }
        }
      }

      if (response.status === 502 || response.status === 503) {
        message = 'The API server is unavailable. Start the backend and try again.';
      } else if (response.status === 500 && (!message || message === `Request failed with status 500`)) {
        message = 'Server internal error. Please verify backend logs.';
      }

      throw new Error(message);
    }

    // Check if response is JSON or blob
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.blob() as unknown as T;
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<{ message: string; user?: UserProfile }> {
    return this.request<{ message: string; user?: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Portal endpoints
  async getDashboard(token: string): Promise<DashboardResponse> {
    return this.request<DashboardResponse>('/portal/dashboard', {
      method: 'GET',
    }, token);
  }

  async viewGrades(token: string, regNumber?: string): Promise<GradeItem[]> {
    const endpoint = regNumber
      ? `/portal/grades?reg_number=${encodeURIComponent(regNumber)}`
      : '/portal/grades';
    return this.request<GradeItem[]>(endpoint, {
      method: 'GET',
    }, token);
  }

  async lookupStudent(regNumber: string, token?: string): Promise<StudentLookupResponse> {
    return this.request<StudentLookupResponse>(
      `/portal/students/lookup?reg_number=${encodeURIComponent(regNumber)}`,
      {
        method: 'GET',
      },
      token
    );
  }

  async getStudents(token: string): Promise<StudentListItem[]> {
    return this.request<StudentListItem[]>('/portal/students', {
      method: 'GET',
    }, token);
  }

  async uploadGrade(data: GradeUploadData, token: string): Promise<{ message: string; grade: GradeItem }> {
    return this.request<{ message: string; grade: GradeItem }>('/portal/grades/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async updateGrade(gradeId: number, data: GradeUpdateData, token: string): Promise<{ message: string; grade: GradeItem }> {
    return this.request<{ message: string; grade: GradeItem }>(`/portal/grades/${gradeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  async deleteGrade(gradeId: number, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/portal/grades/${gradeId}`, {
      method: 'DELETE',
    }, token);
  }

  async getFiles(token: string): Promise<FileItem[]> {
    return this.request<FileItem[]>('/portal/files', {
      method: 'GET',
    }, token);
  }

  async downloadFile(fileId: number, token: string): Promise<Blob> {
    return this.request<Blob>(`/portal/files/${fileId}/download`, {
      method: 'GET',
    }, token);
  }

  async changePassword(data: ChangePasswordData, token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/portal/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  // Admin & IDS Console endpoints
  async getAdminStats(token: string): Promise<AdminStatsResponse> {
    return this.request<AdminStatsResponse>('/admin/stats', {
      method: 'GET',
    }, token);
  }

  async getAdminAlerts(token: string): Promise<AlertItem[]> {
    return this.request<AlertItem[]>('/admin/alerts', {
      method: 'GET',
    }, token);
  }

  async acknowledgeAlert(alertId: number, token: string): Promise<{ message: string; alert_id: number }> {
    return this.request<{ message: string; alert_id: number }>(`/admin/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    }, token);
  }

  async getAdminActivityLogs(token: string): Promise<ActivityLogItem[]> {
    return this.request<ActivityLogItem[]>('/admin/activity-logs', {
      method: 'GET',
    }, token);
  }

  // Simulation endpoints for testing IDS
  async simulateFailedLogin(studentId: number = 1): Promise<any> {
    return this.request<any>(`/portal/failed-login-attempt?student_id=${studentId}`, {
      method: 'POST',
    });
  }

  async simulateActivity(studentId: number = 1, action: string = 'other', success: boolean = true): Promise<any> {
    return this.request<any>(`/portal/activity?student_id=${studentId}&action=${action}&success=${success}`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
