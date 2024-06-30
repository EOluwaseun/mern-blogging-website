import { Link, Navigate } from 'react-router-dom';
import InputBoxComponent from '../components/input.component';
import googleIcon from '../imgs/google.png';
import AnimationWrapper from '../common/page-animation';
import { useContext, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { storeInSession } from '../common/session';
import { UserContext } from '../App';

const UserAuthForm = ({ type }) => {
  // const authForm = useRef();

  //instead of userAuth.access_token. userAuth:{access_token}
  let {
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  // console.log(access_token);

  const userAuthThroughServer = (serverRoute, formData) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
      .then(({ data }) => {
        console.log(data);
        // d key is user which it represent in session storage, while d data we're storing is data
        storeInSession('user', JSON.stringify(data));
        setUserAuth(data);
        console.log(storeInSession);
      })
      .catch(({ response }) => {
        toast.error(response.data.error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let serverRoute = type === 'sign-in' ? '/signin' : '/signup';

    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

    let form = new FormData(formElement);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    let { fullname, email, password } = formData;
    if (fullname) {
      if (fullname.length < 3) {
        return toast.error('Fullname must not be less than 3 characters');
      }
    }
    if (!email.length) {
      return toast.error('Enter email');
    }

    if (!emailRegex.test(email)) {
      return toast.error('invalid email');
    }
    if (!passwordRegex.test(password)) {
      return toast.error(
        'Password should be 6 or 20 character long with numeric, 1 lowercase and 1 uppercase letters'
      );
    }
    userAuthThroughServer(serverRoute, formData);
  };

  //if access token is avalaible navigate to home otherwise go to sign in page
  return access_token ? (
    <Navigate to="/" />
  ) : (
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <form id="formElement" className="w-[80%] max-w-[400px]">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
            {type === 'sign-in' ? 'Welcome back' : 'Join us today'}
          </h1>
          {type != 'sign-in' ? (
            <InputBoxComponent
              name="fullname"
              placeholder={'Fullname'}
              type={'text'}
              icon={'fi-rr-user'}
            />
          ) : (
            ''
          )}
          <InputBoxComponent
            name="email"
            placeholder={'Email'}
            type={'text'}
            icon={'fi-rr-envelope'}
          />
          <InputBoxComponent
            name="password"
            placeholder={'Password'}
            type={'password'}
            icon={'fi-rr-key'}
          />
          <button
            type="submit"
            className="btn-dark center  mt-14"
            onClick={handleSubmit}
          >
            {type.replace('-', ' ')}
          </button>
          <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>or</p>
            <hr className="w-1/2 border-black" />
          </div>
          <button className="btn-dark flex items-center justify-center gap-2 w-[90%]">
            <img src={googleIcon} alt="google icon" className="w-5" />
            Continue with google
          </button>
          {type === 'sign-in' ? (
            <p className="mt-6 text-dark text-xl text-center">
              Don't have an account ?
              <Link
                to={'/sign-up'}
                className="underline text-black text-xl ml-1"
              >
                Join us today
              </Link>
            </p>
          ) : (
            <p className="mt-6 text-dark text-xl text-center">
              Already have an account ?
              <Link
                to={'/sign-in'}
                className="underline text-black text-xl ml-1"
              >
                Sign in here
              </Link>
            </p>
          )}
        </form>
      </section>
    </AnimationWrapper>
  );
};
export default UserAuthForm;
