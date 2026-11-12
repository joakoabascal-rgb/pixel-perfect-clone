import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AccountState = { user: User | null; ready: boolean; isAdmin: boolean };
export const AccountContext = createContext<AccountState>({ user: null, ready: false, isAdmin: false });
export const useAccount = () => useContext(AccountContext);