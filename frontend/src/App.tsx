import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Home from './views/Home.tsx';
import Profile from './views/ViewProfile.tsx';


import Signup from './views/Signup.tsx';
import Login from './views/Login.tsx';
import EditProfile from './views/ProfileForm.jsx'
import AddCertification from './views/AddCertification'
import Certifications from './views/Certifications'
import AddLab from './views/AddLab'
import AddTraing from './views/AddTraining'
import CertificationView from './views/CertificationView'

import HeaderContext from './contexts/HeaderContext.tsx';
import Layout from './Layout';
import { useState } from 'react';
import DrawerContext from './contexts/DrawerContext.ts';

type Header = {
  title: string;
  actions: React.ReactNode;
};

function App() {
  const [header, setHeader] = useState<Header>({
      title: "",
      actions: null,
  });

  const [mobileOpen, setMobileOpen] = useState(false);


  
  return (
    <HeaderContext.Provider value={{ header, setHeader }}>
      <DrawerContext.Provider value={{ mobileOpen, setMobileOpen }}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/certifications" element={<Certifications />} />

              <Route path="/profile/edit" element={<EditProfile mode="edit" />} />
              <Route path="/profile/create" element={<EditProfile mode="create" />} />
              <Route path="/certifications/add" element={<AddCertification />} />
              <Route path="/certifications/:id" element={<CertificationView />} />
              <Route path="/lab-management/lab/add" element={<AddLab />} />
              <Route path="/lab-management/training/add" element={<AddTraing />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </BrowserRouter>
      </DrawerContext.Provider>
    </HeaderContext.Provider>
  );
}

export default App


