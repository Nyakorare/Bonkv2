import { IonContent, IonPage } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Loading: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Check if user has an account
          const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('email', session.user.email)
            .single();

          if (accountError || !accountData) {
            throw new Error('Account not found');
          }

          // Store the access token and redirect to dashboard
          localStorage.setItem('authToken', session.access_token);
          history.replace('/dashboard'); // Use replace instead of push to prevent going back
        } else {
          // Clear any existing auth token
          localStorage.removeItem('authToken');
          history.replace('/login'); // Use replace instead of push to prevent going back
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // Clear any existing auth token on error
        localStorage.removeItem('authToken');
        history.replace('/login'); // Use replace instead of push to prevent going back
      }
    };

    // Delay
    const timer = setTimeout(checkAuth, 1000);
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
              className="w-48 h-48 mb-6 animate-pulse"
            />
            <div className="loader border-t-4 border-b-4 border-white rounded-full w-12 h-12 animate-spin"></div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Loading;