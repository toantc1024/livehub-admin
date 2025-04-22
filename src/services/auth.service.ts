import { AccountMetadata } from "../types/Account";
import supabase from "../supabase/client";

export const loginWithEmailAndPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })
    if (error) {
        throw error;
    }
    return data;
}

export const registerWithEmailAndPassword = async (email: string, password: string, metadata: AccountMetadata) => {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: metadata,
        },
    })
    if (error) {
        throw error;
    }
    return data;
}

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

export const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        throw error;
    }
    return data;
}

export const updateUserMetadata = async (metadata: AccountMetadata) => {
    const { data, error } = await supabase.auth.updateUser({
        data: metadata,
    })
    if (error) {
        throw error;
    }
    return data;
}
