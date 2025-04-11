import { IonContent, IonPage, IonModal, IonAvatar } from '@ionic/react';
import { FaArrowLeft, FaUser, FaLock, FaCamera } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Settings: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('/default-profile.png');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setUsername(profile.username);
          setFullName(profile.full_name);
          setProfileImage(profile.avatar_url || '/default-profile.png');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Generate a unique filename with user's folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setProfileImage(publicUrl);
      setShowImagePicker(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    }
  };

  const handleSaveChanges = async () => {
    try {
      setError('');
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName,
          avatar_url: profileImage
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

      history.goBack();
    } catch (err) {
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
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/default-profile.png';
                  }}
                />
              </div>
              <button
                className="absolute bottom-0 right-0 bg-[#2C2C2C] rounded-full p-2"
                onClick={() => setShowImagePicker(true)}
              >
                <FaCamera className="text-white text-sm" />
              </button>
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
                  readOnly
                  className="w-full p-3 pl-10 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
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

        {/* Image Picker Modal */}
        <IonModal isOpen={showImagePicker} onDidDismiss={() => setShowImagePicker(false)}>
          <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Change Profile Picture</h2>
            <div className="flex space-x-4">
              <button
                className="bg-[#4AB54B] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3A9B3A] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose from Gallery
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                className="bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-md shadow-md hover:bg-gray-400 transition-colors"
                onClick={() => setShowImagePicker(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Settings;