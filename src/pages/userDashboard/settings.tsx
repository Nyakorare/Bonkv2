import { IonContent, IonPage, IonModal, IonAvatar } from '@ionic/react';
import { FaArrowLeft, FaUser, FaLock, FaCamera } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState, useRef } from 'react';

const Settings: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState('john_doe');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('/default-profile.png');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveChanges = () => {
    // Add validation and save logic here
    alert('Changes saved successfully!');
    history.goBack();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    setShowImagePicker(false);
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
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <IonAvatar className="w-24 h-24">
                <img src={profileImage} alt="Profile" className="object-cover" />
              </IonAvatar>
              <button
                className="absolute bottom-0 right-0 bg-[#2C2C2C] rounded-full p-2"
                onClick={() => setShowImagePicker(true)}
              >
                <FaCamera className="text-white text-sm" />
              </button>
            </div>
          </div>

          {/* White Container */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full mb-4 space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-gray-800 font-medium">Username</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 pl-10 rounded-md bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
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
                  className="w-full p-3 pl-10 rounded-md bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
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
                  className="w-full p-3 pl-10 rounded-md bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
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
                  className="w-full p-3 pl-10 rounded-md bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            className="w-full bg-[#4AB54B] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3A9B3A] transition-colors"
            onClick={handleSaveChanges}
          >
            Save Changes
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