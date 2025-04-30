import { IonContent, IonPage } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const Home: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(() => {
      history.push('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [history]);

  return (
    <IonPage>
      <IonContent 
        className="ion-padding"
        fullscreen
        scrollY={false} // Disable scrolling
        style={{
          '--overflow': 'hidden', // Ensure no overflow
          'height': '100vh', // Full viewport height
          'width': '100vw' // Full viewport width
        }}
      >
        <div 
          className="flex justify-center items-center h-full w-full bg-[#5EC95F]"
          style={{
            'overflow': 'hidden', // Prevent any overflow
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'right': '0',
            'bottom': '0'
          }}
        >
          <div className="flex flex-col items-center">
            <img 
              src="/bonk.png" 
              alt="Bonk Logo" 
              className="w-64 h-64 mb-4 animate-bounce" 
            />
            <div className="loader border-t-4 border-white rounded-full w-12 h-12 animate-spin"></div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;