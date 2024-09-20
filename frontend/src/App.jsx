import { Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar.component';
import UserAuthForm from './pages/userAuthForm.page';
import { createContext, useEffect } from 'react';
import { useState } from 'react';
import { lookInSession } from './common/session';
import Editor from './pages/editor.pages';
import HomePage from './pages/home.page';
import EditProfile from './pages/edit-profile.page';

import PublishForm from './components/publish-form.component';
import SideNav from './components/sidenavbar.component';
import SearchPage from './pages/search.page';
import PageNotFound from './pages/404.page';
import ProfilePage from './pages/profile.page';
import BlogPage from './pages/blog.page';
import ChangePassword from './pages/change-password.page';
import Notifications from './pages/notifications.page';
import ManageBlogs from './pages/manage-blogs.page';

export const UserContext = createContext({});

export const ThemeContext = createContext({});

const darkThemePreference = () =>
  window.matchMedia('(prefers-color-scheme:dark)').matches;

// console.log(darkThemePreference);

const App = () => {
  const [userAuth, setUserAuth] = useState({});
  const [theme, setTheme] = useState(() =>
    darkThemePreference ? 'dark' : 'light'
  );

  useEffect(() => {
    //this will get user key from d session storage
    let userInSession = lookInSession('user');
    let themeInSession = lookInSession('theme');

    // if user is login get d user data from the sessionStorage nd set it, otherwise set access token to null
    userInSession
      ? setUserAuth(JSON.parse(userInSession))
      : setUserAuth({ access_token: null });

    if (themeInSession) {
      setTheme(() => {
        document.body.setAttribute('data-theme', themeInSession);

        return themeInSession;
      });
    } else {
      document.body.setAttribute('data-theme', theme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <UserContext.Provider value={{ userAuth, setUserAuth }}>
        <Routes>
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:blog_id" element={<Editor />} />
          <Route path="/publish" element={<PublishForm />} />
          <Route path="/" element={<Navbar />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<SideNav />}>
              <Route path="blogs" element={<ManageBlogs />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="settings" element={<SideNav />}>
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
            <Route path="sign-in" element={<UserAuthForm type={'sign-in'} />} />
            <Route path="sign-up" element={<UserAuthForm type={'sign-up'} />} />
            <Route path="search/:query" element={<SearchPage />} />
            <Route path="user/:id" element={<ProfilePage />} />
            <Route path="blog/:blog_id" element={<BlogPage />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
