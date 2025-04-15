import { supabase } from '../supabaseClient';

// Session timeout in milliseconds (3 minutes)
const SESSION_TIMEOUT = 3 * 60 * 1000;

let timeoutId: NodeJS.Timeout | null = null;

export const resetSessionTimeout = () => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(async () => {
        try {
            // Show inactivity modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <h2 class="text-xl font-bold mb-4">Session Inactive</h2>
                    <p class="text-gray-600 mb-4">You have been inactive for 3 minutes. You will be logged out for security reasons.</p>
                    <div class="flex justify-end">
                        <button class="bg-[#5EC95F] text-white px-4 py-2 rounded" onclick="this.parentElement.parentElement.parentElement.remove(); window.location.href='/login'">
                            OK
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Logout after showing the modal
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