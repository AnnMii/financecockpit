"use client";

import { createContext, useContext } from "react";
import type { Access } from "@/lib/access";

const AccessContext = createContext<Access | null>(null);

/**
 * What the signed-in account may see. For showing or hiding parts of the
 * interface only: the server enforces the same rules where they matter.
 */
export function AccessProvider({
  access,
  children,
}: {
  access: Access;
  children: React.ReactNode;
}) {
  return <AccessContext.Provider value={access}>{children}</AccessContext.Provider>;
}

export function useAccess(): Access {
  const access = useContext(AccessContext);
  if (!access) throw new Error("useAccess needs an AccessProvider");
  return access;
}
