import { useAuthContext } from "@/lib/contexts/auth-context";

export function useAuth() {
  return useAuthContext();
}
