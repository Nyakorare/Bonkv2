import { IonContent, IonPage } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const Loading: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(() => {
      const authToken = localStorage.getItem('authToken');
      // Use history.push instead of window.location for smoother navigation
      history.push(authToken ? '/dashboard' : '/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [history]);

  return (
    <IonPage>
      <IonContent 
        fullscreen
        scrollY={false}
        className="ion-padding"
        style={{
          '--overflow': 'hidden',
          'height': '100vh',
          'width': '100vw'
        }}
      >
        <div 
          className="flex justify-center items-center h-full w-full bg-[#5EC95F]"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div className="flex flex-col items-center">
            <img 
              src="/bonk.png" 
              alt="Bonk Logo" 
              className="w-48 h-48 mb-6 animate-pulse" // Changed to pulse for better loading indication
            />
            <div className="loader border-t-4 border-b-4 border-white rounded-full w-12 h-12 animate-spin"></div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Loading;