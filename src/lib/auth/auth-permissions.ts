import type { Statements } from "better-auth/plugins/access";
import { createAccessControl } from "better-auth/plugins/access";
import { z } from "zod";

// Simple user-level permissions for B2C application
const statement = {
  project: ["create", "share", "update", "delete"],
  subscription: ["manage"],
  account: ["update", "delete"],
} as const satisfies Statements;

export const AuthPermissionSchema = z.object(
  Object.fromEntries(
    Object.entries(statement).map(([key, actions]) => [
      key,
      z
        .array(z.enum([...actions] as unknown as [string, ...string[]]))
        .optional(),
    ]),
  ) as unknown as {
    [K in keyof typeof statement]: z.ZodOptional<
      z.ZodArray<
        z.ZodEnum<
          [
            ...((typeof statement)[K] extends readonly (infer T)[]
              ? T extends string
                ? (typeof statement)[K] extends readonly [string, ...string[]]
                  ? (typeof statement)[K]
                  : never
                : never
              : never),
          ]
        >
      >
    >;
  },
);

export type AuthPermission = z.infer<typeof AuthPermissionSchema>;

export const ac = createAccessControl(statement);

// Single user role with full permissions for their own account
const user = ac.newRole({
  project: ["create", "share", "update", "delete"],
  subscription: ["manage"],
  account: ["update", "delete"],
});

export const roles = { user } as const;

export const RolesKeys = ["user"] as const;

export type AuthRole = keyof typeof roles;
