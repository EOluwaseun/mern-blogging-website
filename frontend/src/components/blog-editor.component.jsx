import { Link, useNavigate, useParams } from 'react-router-dom';
import lightLogo from '../imgs/logo-light.png';
import darkLogo from '../imgs/logo-dark.png';
import AnimationWrapper from '../common/page-animation';
import darkBanner from '../imgs/blog-banner-dark.png';
import lightBanner from '../imgs/banner.png';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { EditorContext } from '../pages/editor.pages';
import EditorJS from '@editorjs/editorjs';
import { tools } from './tools.component';
import { ThemeContext, UserContext } from '../App';

const BlogEditor = () => {
  // blog context
  //get blog, then destructure all of that from blog
  let {
    blogState,
    blogState: { title, banner, content, tags, des },
    setBlogState,
    textEditor,
    setEditorState,
    setTextEditor,
  } = useContext(EditorContext);

  //get access token from the userAuth

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let { theme } = useContext(ThemeContext);

  let { blog_id } = useParams();

  let navigate = useNavigate();

  // console.log(blogState);

  useEffect(() => {
    //if textEditor is ready, set textEditor state
    if (!textEditor.isReady) {
      //this will set all d values in d editor state
      setTextEditor(
        new EditorJS({
          // set some value
          holderId: 'textEditor',
          // data: content, this give editor to be use without any data in it
          data: Array.isArray(content) ? content[0] : content, //check it the data in is an Array
          //being array means i have written somthing in it b4 and i want to get d data
          tools: tools,
          placeholder: 'Write blog',
        })
      );
    }
  }, []);

  const handleBannerUpload = async (e) => {
    const files = e.target.files;
    // console.log(files);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const { data } = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + '/upload',
        formData,
        {
          headers: { 'Content-type': 'multipart/form-data' },
        }
      );
      const img = data.map((i) => ({
        public_id: i.public_id,
        url: i.url,
      }));

      return img;
      // console.log(img);
    } catch (err) {
      alert(err);
    }
  };

  const handleUpload = async (e) => {
    let loadingToast = toast.loading('Uploading');
    const imageUrls = await handleBannerUpload(e);
    toast.dismiss(loadingToast);
    toast.success('Uploaded');
    if (imageUrls && imageUrls.length > 0) {
      // blogBannerRef.current.src = imageUrls[0].url; the URL is passed to banner
      // console.log(imageUrls[0].url);
      // setting banner state
      setBlogState({ ...blogState, banner: imageUrls[0].url });
    } else {
      toast.dismiss(loading);
      toast.error("Image couldn't load");
      console.error('No image URLs returned from upload.');
    }
  };

  const handleTitleKeydown = (e) => {
    // whenever d userss presses d enter key, i want to prevent it from registering
    // 13 is d key code for enter
    if (e.keyCode === 13) {
      e.preventDefault();
    }

    // console.log(e);
  };

  const handleTitleChange = (e) => {
    let input = e.target;

    // this will remove the scroll bar and also set the textarea height to it's not normal height
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';

    //setting the blog
    // values of other things can then be change
    setBlogState({ ...blogState, title: input.value });
  };

  const handleError = (e) => {
    let img = e.target;
    img.src = theme === 'light' ? lightBanner : darkBanner;
  };

  //publish
  const handlePublish = () => {
    //validate b4 publishi
    if (!banner.length) {
      return toast.error('upload a blog banner to publish');
    }
    if (!title?.length) {
      return toast.error('Write blog title to publish');
    }
    //  check if text editor is ready
    if (textEditor.isReady) {
      // save d data into editorjs and convert it into array
      textEditor.save().then((data) => {
        // console.log(data);
        if (data.blocks.length) {
          setBlogState({ ...blogState, content: data });
          setEditorState('publish');
        } else {
          return toast.error('write somthing to publish');
        }
      });
    }
  };

  const handleSaveDraft = (e) => {
    //this condition will stop this function and won't go further if the conditon is true
    if (e.target.className.includes('disable')) {
      return;
    }
    // console.log('hey');

    if (!title?.length) {
      return toast.error('Write blog title before saving it as a draft');
    }

    //disable the button to prevent multiple submission
    let loadingToast = toast.loading('Saving draft...');
    e.target.classList.add('disable');

    if (textEditor.isReady) {
      //its getting content from textEditor direct
      textEditor.save().then((content) => {
        //send the form to d server

        let blogObj = {
          title,
          banner,
          des,
          tags,
          content,
          draft: true, //if draft is true, database will consider it as publishing
        };
        axios
          .post(
            import.meta.env.VITE_SERVER_DOMAIN + '/create-blog',
            { ...blogObj, id: blog_id },
            {
              headers: {
                //only authorised user can post
                Authorization: `Bearer ${access_token}`,
              },
            }
          )
          .then(() => {
            //remove the disable class if it resolve
            e.target.classList.remove('disable');
            toast.dismiss(loadingToast);
            toast.success('Saved');

            //wait 500mls before redirecting user to the dashboard
            setTimeout(() => {
              navigate(`/dashboard/blogs?tab=draft`);
            }, 500);
          })
          .catch(({ response }) => {
            // im destructuring default data which is d response, before having access to the data
            //NB axios uses response to catch error
            //if getting error catch it
            e.target.classList.remove('disable');
            toast.dismiss(loadingToast);

            //this will toast whatever error we have from the backend
            return toast.error(response.data.error);
          });
      });
      // .catch(({ response }) => {
      //   return toast.error(response.data.error);
      // });
    }
  };
  return (
    <>
      <nav className="navbar">
        <Link to={'/'}>
          <img
            src={theme === 'light' ? darkLogo : lightLogo}
            alt="logo"
            className="flex-none w-10"
          />
        </Link>
        {/* line clapm wont break the word, it will only add 3 dots if the world will overflow */}
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {blogState?.title ? blogState?.title : 'New Blog'}
        </p>
        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublish}>
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          {/* max-width it can go is 900 and if we have screen less than 900, it will b full */}
          <div className="mx-auto max-w-[900px] w-full">
            {/* aspect-video = 16:9 ratio */}
            <div className="relative aspect-video hover:opacity-80 border-4 border-grey">
              <label htmlFor="uploadBanner">
                <img
                  // ref={blogBannerRef}
                  //default value is the banner image
                  src={banner}
                  alt="default-banner"
                  className="z-20"
                  //onError triggers whenever img src has error
                  onError={handleError}
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  className="cursor-pointer"
                  onChange={handleUpload}
                />
              </label>
            </div>
            <textarea
              defaultValue={blogState?.title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none
              mt-10 leading-tight placeholder:opacity-40 bg-white"
              onKeyDown={handleTitleKeydown}
              onChange={handleTitleChange}
            ></textarea>
            <hr className="w-full opacity-10 my-5" />

            {/* text editor */}
            <div id="textEditor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
