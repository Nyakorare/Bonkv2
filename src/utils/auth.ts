import { supabase } from '../supabaseClient';

// Session timeout in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

let timeoutId: NodeJS.Timeout | null = null;

export const resetSessionTimeout = () => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(async () => {
        try {
            await handleLogout();
        } catch (error) {
            console.error('Error during auto logout:', error);
        }
    }, SESSION_TIMEOUT);
};

export const handleLogout = async () => {
    try {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // First redirect to loading page
        window.location.href = '/loading';
        
        // After a short delay, redirect to login
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
}; 