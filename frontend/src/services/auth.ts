import { authApi } from "./api";

export const authService = {
  login: async (email: string, password: string): Promise<void> => {
    const token = await authApi.login(email, password);
    localStorage.setItem("access_token", token.access_token);
  },

  register: async (email: string, password: string): Promise<void> => {
    await authApi.register(email, password);
    // Auto-login after registration
    await authService.login(email, password);
  },

  logout: (): void => {
    localStorage.removeItem("access_token");
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("access_token");
  },

  getToken: (): string | null => {
    return localStorage.getItem("access_token");
  },
};
