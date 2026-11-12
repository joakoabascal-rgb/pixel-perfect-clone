import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getUser: vi.fn(), signOut: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth, rpc: auth.rpc } }));
import { checkIsAdmin } from "@/lib/admin";
import { signOutAccount } from "@/lib/auth-actions";
import { QueryClient } from "@tanstack/react-query";

describe("Visitor accounts", () => {
  beforeEach(() => vi.resetAllMocks());
  it("does not grant editing to a signed-in visitor without an admin role", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "visitor" } } });
    auth.rpc.mockResolvedValue({ data: false, error: null });
    expect(await checkIsAdmin()).toBe(false);
    expect(auth.rpc).toHaveBeenCalledWith("has_role", { _user_id: "visitor", _role: "admin" });
  });
  it("does not grant editing while signed out", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null } });
    expect(await checkIsAdmin()).toBe(false);
    expect(auth.rpc).not.toHaveBeenCalled();
  });
  it("clears cached private data before signing out", async () => {
    const qc = new QueryClient();
    qc.setQueryData(["private"], { secret: "cached" });
    auth.signOut.mockImplementation(async () => {
      expect(qc.getQueryData(["private"])).toBeUndefined();
      return { error: null };
    });
    await signOutAccount(qc);
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
});