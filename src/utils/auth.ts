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
        
        // Force a hard refresh of the app
        window.location.href = '/login';
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
}; 