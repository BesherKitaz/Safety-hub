import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Home from './views/Home.tsx';
import Profile from './views/ViewProfile.tsx';

import NavigationSidePanelComponent  from './components/NavigationMenu.js';
import Signup from './views/Signup.tsx';
import Login from './views/Login.tsx';
import EditProfile from './views/ProfileForm.jsx'
import AddCertification from './views/AddCertification'
import Certifications from './views/Certifications'
import AddLab from './views/AddLab'
import AddTraing from './views/AddTraining'
import CertificationView from './views/CertificationView'

import HeaderContext from './HeaderContext.tsx';
import { useState } from 'react';

type Header = {
  title: string;
  actions: React.ReactNode;
};

function App() {
  const [header, setHeader] = useState<Header>({
      title: "",
      actions: null,
  });

  
  return (

    <HeaderContext.Provider value={{ header, setHeader}}>
      <BrowserRouter>
{/*         <NavigationMenuComponent />
 */}        <NavigationSidePanelComponent />
        <Routes> 
          {/* Main Navigation Routes */}
          <Route path="/login" element={< Login />} />
          <Route path="/signup" element={< Signup />} />
          <Route path="/" element={< Home />} />
          <Route path="/profile" element={< Profile />} />
          <Route path="/certifications" element={< Certifications />} />

          {/* Secondary Routes */}
          <Route path="/profile/edit" element={< EditProfile mode="edit" />} />
          <Route path="/profile/create" element={< EditProfile mode="create" />} />
          <Route path="/certifications/add" element={< AddCertification />} />
          <Route path="/certifications/:id" element={< CertificationView />} />
          <Route path="/lab-management/lab/add" element={< AddLab />} />
          <Route path="/lab-management/training/add" element={< AddTraing />} />
        </Routes>
      </BrowserRouter>
    </HeaderContext.Provider>
  )
}

export default App
