import "@testing-library/jest-dom/vitest";

import type { PrismaClient } from "@prisma/client";
import type { AuthClientType } from "@/lib/auth-client";
import { cleanup } from "@testing-library/react";
import { fetch } from "cross-fetch";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { Resend } from "resend";
import type Stripe from "stripe";
import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

beforeEach(() => {
  cleanup();
});

// MOCKS

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      mockLocalStorage[key] = undefined as unknown as string;
    }),
    clear: vi.fn(() => {
      Object.keys(mockLocalStorage).forEach((key) => {
        mockLocalStorage[key] = undefined as unknown as string;
      });
    }),
  },
  writable: true,
});

// Mock next/navigation
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");

  // Helper to create a fully mocked URLSearchParams that passes TypeScript checks
  const createMockSearchParams = (
    defaultParams: Record<string, string> = {},
  ) => {
    const params = new Map(Object.entries(defaultParams));

    // Create an empty iterator
    const emptyIterator = {
      next: () => ({ done: true, value: undefined }),
      [Symbol.iterator]: function () {
        return this;
      },
    };

    return {
      get: vi.fn((key: string) => params.get(key) ?? null),
      getAll: vi.fn((key: string) =>
        params.has(key) ? [params.get(key) as string] : [],
      ),
      has: vi.fn((key: string) => params.has(key)),
      keys: vi.fn(() =>
        params.size
          ? Array.from(params.keys())[Symbol.iterator]()
          : emptyIterator,
      ),
      values: vi.fn(() =>
        params.size
          ? Array.from(params.values())[Symbol.iterator]()
          : emptyIterator,
      ),
      entries: vi.fn(() =>
        params.size
          ? Array.from(params.entries())[Symbol.iterator]()
          : emptyIterator,
      ),
      forEach: vi.fn(
        (
          callback: (
            value: string,
            key: string,
            parent: URLSearchParams,
          ) => void,
        ) => {
          params.forEach((value, key) => {
            // Using mock parent as URLSearchParams is not constructable in tests
            callback(value, key, {} as URLSearchParams);
          });
        },
      ),
      toString: vi.fn(() => {
        return Array.from(params.entries())
          .map(([key, value]) => `${key}=${value}`)
          .join("&");
      }),
      // These props need to be present for ReadonlyURLSearchParams interface
      append: vi.fn(),
      delete: vi.fn(),
      set: vi.fn(),
      sort: vi.fn(),
      size: params.size,
      [Symbol.iterator]: vi.fn(() => params.entries()),
    };
  };

  return {
    ...actual,
    useRouter: vi.fn().mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: vi.fn().mockReturnValue(createMockSearchParams()),
    readonlySearchParamsHook: vi.fn().mockReturnValue(createMockSearchParams()),
  };
});

const prisma = mockDeep<PrismaClient>();
const stripe = mockDeep<Stripe>();
const authClient = mockDeep<AuthClientType>();
const resend = mockDeep<Resend>();
global.fetch = fetch;

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/stripe", () => ({ stripe }));
vi.mock("@/lib/auth-client", () => ({ authClient }));
vi.mock("@/lib/mail/resend", () => ({ resend }));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/auth/auth-user", () => ({
  getUser: vi.fn(),
  getAuthorizedApiUser: vi.fn(),
  getRequiredUser: vi.fn(),
}));
vi.mock("@/lib/organizations/get-org", () => ({
  getCurrentOrg: vi.fn(),
  getRequiredCurrentOrg: vi.fn(),
}));

// Mock i18n provider with actual translations
vi.mock("@/i18n/provider", () => {
  const mockMessages: Record<string, unknown> = {
    auth: {
      form: {
        name: "Name",
        email: "Email",
        emailPlaceholder: "you@example.com",
        password: "Password",
      },
      signIn: {
        description: "Sign in to continue to your dashboard.",
        emailPlaceholder: "you@example.com",
        forgotPassword: "Forgot password?",
        submit: "Sign in",
        magicLinkSubmit: "Sign in with magic link",
        magicLinkPrompt: "Prefer a magic link?",
        magicLinkAction: "Login with magic link",
        passwordPrompt: "Prefer a password?",
        passwordAction: "Use password",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        or: "or",
        lastUsed: "Last used",
        provider: "Continue with {provider}",
      },
      signUp: {
        title: "Create your {app} account",
        description: "Get started in minutes with a free account.",
        namePlaceholder: "Your name",
        emailPlaceholder: "you@example.com",
        verifyPassword: "Verify password",
        passwordMismatch: "Password does not match",
        submit: "Sign up",
        hasAccount: "Already have an account?",
        signIn: "Sign in",
        validation: {
          nameRequired: "Name is required",
          emailInvalid: "Invalid email address",
          passwordMin: "Password must be at least 8 characters",
          verifyPasswordMin:
            "Password confirmation must be at least 8 characters",
          passwordMismatch: "Password does not match",
        },
      },
      forgetPassword: {
        title: "Forgot your password?",
        description: "Enter your email to receive a reset link.",
        submit: "Send reset link",
      },
      resetPassword: {
        title: "Set a new password",
        description: "Choose a strong password to secure your account.",
        newPassword: "New password",
        passwordPlaceholder: "At least 8 characters",
        passwordMin: "Password must be at least 8 characters",
        submit: "Update password",
        success: "Password updated",
      },
      logout: "Log out",
    },
    actions: {
      close: "Close",
      toggleTheme: "Toggle theme",
      cancel: "Cancel",
      tryAgain: "Try again",
      save: "Save",
    },
    common: {
      error: "An error occurred",
    },
  };

  // Helper function to get nested value from object by dot-notation key
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string,
  ): string => {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return path; // Return the key if not found
      }
    }
    return typeof current === "string" ? current : path;
  };

  // Helper function to interpolate variables in translations
  const interpolate = (
    template: string,
    vars?: Record<string, string | number>,
  ): string => {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, key: string) =>
      key in vars ? String(vars[key]) : `{${key}}`,
    );
  };

  return {
    useI18n: () => ({
      locale: "en",
      messages: mockMessages,
      t: (key: string, vars?: Record<string, string | number>) =>
        interpolate(getNestedValue(mockMessages, key), vars),
      tm: (key: string, vars?: Record<string, string | number>) =>
        interpolate(getNestedValue(mockMessages, key), vars),
    }),
    I18nProvider: async ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

// Define the type for our global helper

declare global {
  var createTestSearchParams: (
    params?: Record<string, string>,
  ) => ReadonlyURLSearchParams;
}

beforeEach(() => {
  // Reset mocks
  mockReset(prisma);
  mockReset(stripe);
  mockReset(authClient);

  // Reset localStorage mock
  vi.mocked(window.localStorage.getItem).mockClear();
  vi.mocked(window.localStorage.setItem).mockClear();
  vi.mocked(window.localStorage.removeItem).mockClear();
  vi.mocked(window.localStorage.clear).mockClear();

  // Mock toast
  vi.mock("sonner", () => ({
    toast: {
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  }));

  // Clear localStorage without using delete
  Object.keys(mockLocalStorage).forEach((key) => {
    mockLocalStorage[key] = undefined as unknown as string;
  });

  // Expose helper for creating search params mocks with specific values
  global.createTestSearchParams = (
    params: Record<string, string> = {},
  ): ReadonlyURLSearchParams => {
    const mockSearchParams = {
      get: vi.fn((key: string) => params[key] ?? null),
      getAll: vi.fn((key: string) => (params[key] ? [params[key]] : [])),
      has: vi.fn((key: string) => key in params),
      keys: vi.fn(() => Object.keys(params)[Symbol.iterator]()),
      values: vi.fn(() => Object.values(params)[Symbol.iterator]()),
      entries: vi.fn(() => Object.entries(params)[Symbol.iterator]()),
      forEach: vi.fn(
        (
          callback: (
            value: string,
            key: string,
            parent: URLSearchParams,
          ) => void,
        ) => {
          Object.entries(params).forEach(([key, value]) => {
            // Using mock parent as URLSearchParams is not constructable in tests
            callback(value, key, {} as URLSearchParams);
          });
        },
      ),
      toString: vi.fn(() => {
        return Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");
      }),
      // These props need to be present for ReadonlyURLSearchParams interface
      append: vi.fn(),
      delete: vi.fn(),
      set: vi.fn(),
      sort: vi.fn(),
      size: Object.keys(params).length,
      [Symbol.iterator]: vi.fn(() => Object.entries(params)[Symbol.iterator]()),
    };

    return mockSearchParams as ReadonlyURLSearchParams;
  };
});
