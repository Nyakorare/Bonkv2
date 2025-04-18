import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bonk.app',
  appName: 'Bonk',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      android: {
        permissions: ['android.permission.CAMERA']
      },
      ios: {
        permissions: ['NSCameraUsageDescription']
      }
    }
  }
};

export default config;
