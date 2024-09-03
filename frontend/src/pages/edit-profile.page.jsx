import { useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from '../App';
import axios from 'axios';
import AnimationWrapper from '../common/page-animation';
import Loader from '../components/loader.component';
import { ProfileDataStructure } from './profile.page';
import toast, { Toaster } from 'react-hot-toast';
import InputBoxComponent from '../components/input.component';
import { storeInSession } from '../common/session';

const EditProfile = () => {
  // get user data from backend

  let bioLimit = 150;
  let profileImEle = useRef();
  let editProfileRef = useRef();

  const {
    userAuth,
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  const [profile, setProfile] = useState(ProfileDataStructure);
  const [loading, setLoading] = useState(true);

  const [charactersLeft, setCharactersLeft] = useState(bioLimit);
  const [updatedProfileImg, setUpdatedProfileImg] = useState(null);

  let {
    personal_info: {
      fullname,
      username: profile_username,
      profile_img,
      email,
      bio,
    },
    social_links,
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

  const handleCharactersChange = (e) => {
    setCharactersLeft(bioLimit - e.target.value.length);
  };

  const handleImagePrev = (e) => {
    let img = e.target.files[0];
    profileImEle.current.src = URL.createObjectURL(img);

    setUpdatedProfileImg(img);
  };

  const handleImgUpload = async (e) => {
    e.preventDefault();

    if (updatedProfileImg) {
      let loadingToast = toast.loading('Uploading...');
      e.target.setAttribute('disabled', true);

      const formData = new FormData();
      formData.append('images', updatedProfileImg);

      try {
        const { data } = await axios.post(
          import.meta.env.VITE_SERVER_DOMAIN + '/upload',
          formData,
          {
            headers: { 'Content-type': 'multipart/form-data' },
          }
        );
        const imgUrl = data.map((i) => ({
          //   public_id: i.public_id,
          url: i.url,
        }));
        // return img;
        // console.log(imgUrl[0].url);
        if (imgUrl) {
          axios
            .post(
              import.meta.env.VITE_SERVER_DOMAIN + '/update-profile-img',
              {
                imageUrl: imgUrl[0].url,
              },
              {
                headers: {
                  //only authorised user can post
                  Authorization: `Bearer ${access_token}`,
                },
              }
            )
            .then(({ data }) => {
              let newUserAuth = { ...userAuth, profile_img: data.profile_img };

              // store in d session
              storeInSession('user', JSON.stringify(newUserAuth));
              setUserAuth(newUserAuth);

              setUpdatedProfileImg(null);

              toast.dismiss(loadingToast);
              e.target.removeAttribute('disabled');
              toast.success('uploaded');
            })
            .catch(({ response }) => {
              toast.dismiss(loadingToast);
              e.target.removeAttribute('disabled');
              toast.error(response.error);
            });
        }
      } catch (err) {
        alert(err);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let form = new FormData(editProfileRef.current);

    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    let {
      username,
      bio,
      youtube,
      facebook,
      twitter,
      github,
      instagram,
      website,
    } = formData;

    if (username.length < 3) {
      return toast.error('Username should be atleast 3 letters long');
    }

    if (bio.length > bioLimit) {
      return toast.error(`Bio should not be more than ${bioLimit}`);
    }

    let loadingToast = toast.loading('Updating...');
    e.target.setAttribute('disabled', true);

    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + '/update-profile',
        {
          username,
          bio,
          social_links: {
            youtube,
            facebook,
            twitter,
            github,
            instagram,
            website,
          },
        },
        {
          headers: {
            //only authorised user can post
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(({ data }) => {
        if (userAuth.username != data.username) {
          let newUserAuth = { ...userAuth, username: data.username };

          storeInSession('user', JSON.stringify(newUserAuth));

          setUserAuth(newUserAuth);
        }

        toast.dismiss(loadingToast);
        e.target.removeAttribute('disabled');
        toast.success('profile updated');
      })
      .catch(({ response }) => {
        toast.dismiss(loadingToast);
        e.target.removeAttribute('disabled');
        toast.error(response.data.error);
      });
  };

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <form ref={editProfileRef}>
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
                <img src={profile_img} ref={profileImEle} />
              </label>
              <input
                type="file"
                id="uploadImg"
                accept=".jpeg, .jpg, .png"
                hidden
                onChange={handleImagePrev}
              />
              <button
                onClick={handleImgUpload}
                className="btn-light mt-5 max-lg:center lg:w-full px-10"
              >
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
                    value={email}
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

              <p className="text-dark-grey -mt-3">
                Username will be used to search user and it will be visible to
                all users
              </p>

              <textarea
                className="input-box h-64 lg:h-40 resize-none leading-2 mt-5 pl-5"
                name={'bio'}
                placeholder="bio"
                defaultValue={bio}
                maxLength={bioLimit}
                onChange={handleCharactersChange}
              ></textarea>
              <p className="ml-1 text-dark-grey">
                {charactersLeft} characters left
              </p>
              <p className="my-6 text-dark-grey">Add your social links</p>

              <div className="md:grid md:grid-cols-2 gap-x-6">
                {Object.keys(social_links).map((key, i) => {
                  let link = social_links[key];

                  return (
                    <InputBoxComponent
                      key={i}
                      name={key}
                      type={'text'}
                      value={link}
                      placeholder={'https://'}
                      icon={` ${
                        key != 'website'
                          ? 'fi fi-brands-' + key
                          : 'fi fi-rr-globe'
                      }
                  }`}
                    />
                  );
                })}
              </div>

              <button
                onClick={handleSubmit}
                className="btn-dark w-auto px-10"
                type="submit"
              >
                Update
              </button>
            </div>
          </div>
        </form>
      )}
    </AnimationWrapper>
  );
};
export default EditProfile;
