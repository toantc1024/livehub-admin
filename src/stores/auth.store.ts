import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStore = {
    user: User | null;
    setUser: (user: User | null) => void;
    clearUser: () => void;
}

const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user: User | null) => set({ user }),
            clearUser: () => set({ user: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
