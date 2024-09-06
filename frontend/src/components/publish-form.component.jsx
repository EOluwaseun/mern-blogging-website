import toast, { Toaster } from 'react-hot-toast';
import AnimationWrapper from '../common/page-animation';
import { useContext } from 'react';
import { EditorContext } from '../pages/editor.pages';
import Tags from './tags.component';
import { UserContext } from '../App';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const PublishForm = () => {
  let characterLimit = 200;
  let tagLimit = 10;

  let { blog_id } = useParams();

  let {
    blogState,
    blogState: { banner, title, tags, des, content },
    setBlogState,
    setEditorState,
  } = useContext(EditorContext);

  //get access token from the userAuth
  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let navigate = useNavigate();

  //close button
  const handleClose = () => {
    setEditorState('editor');
  };

  const handleBlogTitleChange = (e) => {
    let input = e.target;

    // destructure blogstate and update d title with the input value
    setBlogState({ ...blogState, title: input.value });
  };

  const handleTextArea = (e) => {
    let input = e.target;

    setBlogState({ ...blogState, des: input.value });
  };

  const handleTitleKeydown = (e) => {
    // whenever d userss presses d enter key, i want to prevent it from registering
    // 13 is d key code for enter
    if (e.keyCode === 13) {
      e.preventDefault();
    }
    // console.log(e);
  };

  const handleKeydown = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      //dont register enter and comma, b4 passing the value to tag
      let tag = e.target.value;
      // console.log(tag);
      //if tags array is less than tagLimit run this function otherwise don't run
      if (tags.length < tagLimit) {
        //if tags array does not have d new tag, and the new tag  has a length. run this function
        if (!tags.includes(tag) && tag.length) {
          //setblogstate, update tags array, destructure tags array and pass a newly tag
          setBlogState({ ...blogState, tags: [...tags, tag] });
          // console.log(tags);
        }
      } else {
        toast.error(`You can add max ${tagLimit} Tags`);
      }
      e.target.value = '';
    }
  };

  const publishBlog = (e) => {
    //this condition will stop this function and won't go further if the conditon is true
    if (e.target.className.includes('disable')) {
      return;
    }
    // console.log('hey');

    if (!title.length) {
      return toast.error('Write blog title before publishing');
    }
    if (!des.length || des.length > characterLimit) {
      return toast.error(
        `Write description about your blog withing ${characterLimit} characters to publish`
      );
    }
    if (!tags.length) {
      return toast.error('Enter atleast 1 tag to help us rank your blog');
    }
    //disable the button to prevent multiple submission
    let loadingToast = toast.loading('Publishing...');
    e.target.classList.add('disable');

    //send the form to d server

    let blogObj = {
      title,
      banner,
      des,
      tags,
      content,
      draft: false,
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
        toast.success('Published');

        //wait 500mls before redirecting user to the dashboard
        setTimeout(() => {
          navigate('/');
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
  };

  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
        <Toaster />
        <button
          className="w-12 h-12 absolute right-[5vw] top-[5%] lg-top-[10%]"
          onClick={handleClose}
        >
          <i className="fi fi-br-cross"></i>
        </button>
        <div className="center">
          <p className="text-dark-grey mb-1">Preview</p>
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} />
          </div>
          <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">
            {/* line clamp-2 means the line cant go more than 2 line */}
            {title}
          </h1>
          <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
            {des}
          </p>
        </div>
        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
          <input
            type="text"
            placeholder="Blog Title"
            defaultValue={title}
            className="input-box pl-4"
            onChange={handleBlogTitleChange}
          />
          <p className="text-dark-grey mb-2 mt-9">
            Short description about your blog
          </p>
          <textarea
            maxLength={characterLimit}
            defaultValue={des}
            className="h-40 resize-none leading-7 input-box pl-4"
            onChange={handleTextArea}
            onKeyDown={handleTitleKeydown}
          ></textarea>
          <p className="mt-1 text-dark-grey text-sm text-right">
            {characterLimit - des.length} characters left
          </p>
          <p className="text-dark-grey mb-2 mt-9">
            Topics - (Helps in searching and ranking your post)
          </p>
          <div className="relative input-box pl-2 py-2 pb-4">
            <input
              type="text"
              placeholder="topics"
              className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white outline-none"
              onKeyDown={handleKeydown}
            />
            {tags.map((tag, i) => {
              return <Tags tag={tag} tagIndex={i} key={i} />;
            })}
          </div>
          <p className="mt-1 mb-4 text-dark-grey text-right">
            {tagLimit - tags.length} Tags left
          </p>
          <button className="btn-dark px-8" onClick={publishBlog}>
            Publish
          </button>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
