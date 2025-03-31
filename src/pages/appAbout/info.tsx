import { IonContent, IonPage } from '@ionic/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const Info: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent 
        fullscreen
        scrollY={false} // Disable scrolling
        style={{
          '--overflow': 'hidden',
          'height': '100vh'
        }}
      >
        {/* Header - fixed height */}
        <div className="flex justify-center items-center p-4 bg-[#5EC95F] sticky top-0 z-10 h-16">
          <FaArrowLeft
            className="absolute left-4 text-black text-2xl cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => history.push('/login')}
          />
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            BANK OF KEEPS
          </div>
        </div>

        {/* Main Content - fills remaining space without scrolling */}
        <div className="flex flex-col bg-gradient-to-b from-[#5EC95F] to-[#4AB54B]" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Scrollable content container */}
          <div className="flex-1 overflow-y-auto">
            {/* Our Team Section */}
            <div className="px-4 py-4">
              <h2 className="text-white text-2xl font-bold mb-3 text-center">Our Team</h2>
              <div className="flex overflow-x-auto pb-3 space-x-4 scrollbar-hide">
                {[
                  { name: 'Glenn Galbadores', position: 'Project Manager & Lead Developer' },
                  { name: 'Kurt Ballarta', position: 'Developer' },
                  { name: 'Justine Mantilla', position: 'Developer' },
                  { name: 'John Marquez', position: 'Lead Design' },
                  { name: 'Ken Montano', position: 'Lead Marketer' },
                ].map((person, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center bg-white rounded-xl shadow-lg p-3 min-w-[140px] flex-shrink-0"
                  >
                    <div className="w-16 h-16 mb-2 rounded-full bg-white border-4 border-[#5EC95F] overflow-hidden shadow-md">
                      <img
                        src={`/group/${person.name.split(' ')[0].toLowerCase()}.jpg`}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-black font-bold text-sm text-center">{person.name}</p>
                    <p className="text-gray-600 text-xs text-center">{person.position}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* About Sections */}
            <div className="px-4 space-y-4 pb-4">
              {/* About Team */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h2 className="text-xl font-bold text-center text-gray-800 mb-3">
                  About Us
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our team is composed of passionate individuals dedicated to delivering a seamless and secure financial management experience. 
                  From development to design and marketing, each member has contributed their expertise to make Bank on Keeps a reality.
                </p>
              </div>

              {/* About App */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h2 className="text-xl font-bold text-center text-gray-800 mb-3">
                  About Bonk
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Bank on Keeps is a comprehensive financial management application designed to help users take control of their personal finances. 
                  Our platform offers intuitive tools for expense tracking, budget planning, and savings management.
                  This project is created to comply with Computer Science Elective -4: Mobile Development to Mr. Tomagan.
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Get Started Button at bottom */}
          <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-[#4AB54B] to-transparent">
            <button 
              className="w-full bg-white hover:bg-gray-100 text-[#5EC95F] font-bold py-3 px-4 rounded-full transition-colors shadow-lg"
              onClick={() => history.push('/login')}
            >
              Get Started
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Info;