import { useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from '../App';
import axios from 'axios';
import AnimationWrapper from '../common/page-animation';
import Loader from '../components/loader.component';
import { ProfileDataStructure } from './profile.page';
import { Toaster } from 'react-hot-toast';
import InputBoxComponent from '../components/input.component';

const EditProfile = () => {
  // get user data from backend

  const {
    userAuth,
    userAuth: { access_token },
  } = useContext(UserContext);

  const [profile, setProfile] = useState(ProfileDataStructure);
  const [loading, setLoading] = useState(true);

  let {
    personal_info: {
      fullname,
      username: profile_username,
      profile_img,
      email,
      bio,
    },
    social_links: {},
  } = profile;

  useEffect(() => {
    if (access_token) {
      axios
        .post(import.meta.env.VITE_SERVER_DOMAIN + '/get-profile', {
          username: userAuth.username,
        })
        .then(({ data }) => {
          //   console.log(data);
          setProfile(data);
          //   console.log(profile);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [access_token]);

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <form>
          <Toaster />
          <h1 className="max-md:hidden">Edit Profile</h1>

          <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
            <div className="max-lg:center mb-5">
              <label
                htmlFor="uploadImg"
                id="profileImgLabel"
                className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden"
              >
                <div className="absolute w-full h-full top-0 left-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 cursor-pointer text-white text-xl">
                  Upload Image
                </div>
                <img src={profile_img} />
              </label>
              <input
                type="file"
                id="uploadImg"
                accept=".jpeg .jpg .png"
                hidden
              />
              <button className="btn-light mt-5 max-lg:center lg:w-full px-10">
                Upload
              </button>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                <div>
                  <InputBoxComponent
                    name={'fullname'}
                    type={'text'}
                    value={fullname}
                    placeholder={'Fullname'}
                    disabled={true}
                    icon={'fi-rr-user'}
                  />
                </div>

                <div>
                  <InputBoxComponent
                    name={'email'}
                    type={'email'}
                    value={fullname}
                    placeholder={'Email'}
                    disabled={true}
                    icon={'fi-rr-envelope'}
                  />
                </div>
              </div>
              <InputBoxComponent
                type={'text'}
                name={'username'}
                placeholder={'Username'}
                value={profile_username}
                icon={'fi-rr-at'}
              />
            </div>
          </div>
        </form>
      )}
    </AnimationWrapper>
  );
};
export default EditProfile;
