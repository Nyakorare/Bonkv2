import { IonContent, IonPage, IonAlert } from '@ionic/react';
import { FaArrowLeft, FaUser, FaLock, FaCamera } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Settings: React.FC = () => {
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('No user found');

                // First get the account
                const { data: account, error: accountError } = await supabase
                    .from('accounts')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (accountError) throw accountError;

                // Then get the profile using the account ID
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('account_id', account.id)
                    .single();

                if (profileError) throw profileError;

                setUser(user);
                setProfile(profile);
                setUsername(user.email || '');
                setFullName(`${profile.first_name} ${profile.last_name}`);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data');
            }
        };

        fetchUserData();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            setError(null);

            // Basic validation
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                throw new Error('Image size must be less than 2MB');
            }

            if (!file.type.startsWith('image/')) {
                throw new Error('Please upload an image file');
            }

            // Get the current user's session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            // Create a unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

            // Upload the file
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update the profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('account_id', profile.account_id);

            if (updateError) throw updateError;

            // Update local state
            setProfile({ ...profile, avatar_url: publicUrl });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error uploading image:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        try {
            setError(null);
            setLoading(true);

            if (!user) throw new Error('No user found');

            // Update profile name
            const nameParts = fullName.split(' ');
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: nameParts[0],
                    last_name: nameParts.slice(1).join(' ')
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Update password if provided
            if (currentPassword && newPassword && confirmPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error('New passwords do not match');
                }

                const { error: passwordError } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (passwordError) throw passwordError;
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving changes:', err);
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage style={{ height: '100%', width: '100%' }}>
            <IonContent 
                fullscreen
                scrollY={true}
                style={{
                    '--background': '#5EC95F',
                    height: '100%',
                    width: '100%',
                }}
            >
                {/* Header - fixed height */}
                <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-16">
                    <FaArrowLeft
                        className="text-black text-2xl absolute left-4 cursor-pointer"
                        onClick={() => history.goBack()}
                    />
                    <h1 className="text-black text-xl font-bold">Account Settings</h1>
                </div>

                {/* Main content area - scrollable */}
                <div className="flex flex-col bg-[#5EC95F] px-4 w-full min-h-[calc(100%-64px)] pb-4">
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 bg-white">
                                {profile?.avatar_url ? (
                                    <img 
                                        src={profile.avatar_url} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <FaUser className="text-gray-400 text-4xl" />
                                    </div>
                                )}
                            </div>
                            <button
                                className="absolute bottom-0 right-0 bg-[#2C2C2C] rounded-full p-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FaCamera className="text-white text-sm" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* White Container */}
                    <div className="bg-white rounded-lg p-6 space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-gray-800 font-medium">Email</label>
                            <div className="relative">
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={username}
                                    readOnly
                                    className="w-full p-3 pl-10 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Full Name Field */}
                        <div className="space-y-2">
                            <label className="text-gray-800 font-medium">Full Name</label>
                            <div className="relative">
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full p-3 pl-10 rounded-md bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                />
                            </div>
                        </div>

                        {/* Current Password Field */}
                        <div className="space-y-2">
                            <label className="text-gray-800 font-medium">Current Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full p-3 pl-10 rounded-md bg-[#F5F5F5] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                    placeholder="Enter current password"
                                />
                            </div>
                        </div>

                        {/* New Password Field */}
                        <div className="space-y-2">
                            <label className="text-gray-800 font-medium">New Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 pl-10 rounded-md bg-[#F5F5F5] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                    placeholder="Enter new password"
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-gray-800 font-medium">Confirm Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 pl-10 rounded-md bg-[#F5F5F5] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        className="w-full bg-[#4AB54B] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3A9B3A] transition-colors mt-6"
                        onClick={handleSaveChanges}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Success Alert */}
                <IonAlert
                    isOpen={success}
                    onDidDismiss={() => setSuccess(false)}
                    header="Success"
                    message="Changes saved successfully!"
                    buttons={['OK']}
                />

                {/* Error Alert */}
                <IonAlert
                    isOpen={!!error}
                    onDidDismiss={() => setError(null)}
                    header="Error"
                    message={error || ''}
                    buttons={['OK']}
                />
            </IonContent>
        </IonPage>
    );
};

export default Settings;