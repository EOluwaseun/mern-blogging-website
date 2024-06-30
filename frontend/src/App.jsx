import { Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar.component';
import UserAuthForm from './pages/userAuthForm.page';
import { createContext, useEffect } from 'react';
import { useState } from 'react';
import { lookInSession } from './common/session';

export const UserContext = createContext({});
const App = () => {
  const [userAuth, setUserAuth] = useState({});

  useEffect(() => {
    //this will get user key from d session storage
    let userInSession = lookInSession('user');

    // if user is login get d user data from the sessionStorage nd set it, otherwise set access token to null
    userInSession
      ? setUserAuth(JSON.parse(userInSession))
      : setUserAuth({ access_token: null });
  }, []);

  return (
    <UserContext.Provider value={{ userAuth, setUserAuth }}>
      <Routes>
        <Route path="/" element={<Navbar />}>
          <Route path="/sign-in" element={<UserAuthForm type={'sign-in'} />} />
          <Route path="/sign-up" element={<UserAuthForm type={'sign-up'} />} />
        </Route>
      </Routes>
    </UserContext.Provider>
  );
};

export default App;
