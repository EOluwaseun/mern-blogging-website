import axios from 'axios';
import { useContext, useEffect } from 'react';
import { BlogContext } from '../pages/blog.page';
import { Link } from 'react-router-dom';
import { UserContext } from '../App';
import toast, { Toaster } from 'react-hot-toast';

const BlogInteraction = () => {
  let {
    blog,
    blog: {
      _id,
      blog_id,
      title,
      activity,
      activity: { total_likes, total_comments },
      author: {
        personal_info: { username: author_username }, //username from d blog
      },
    },
    setBlog,
    isLikedByUser,
    setIsLikedByUser,
    // commentWrapper,
    setCommentWrapper,
    // totalParentCommentLoaded,
    // setTotalParentCommentLoaded,
  } = useContext(BlogContext);

  const {
    userAuth: { username, access_token },
  } = useContext(UserContext); //login username

  // useffect is used to check if user already like d blog
  useEffect(() => {
    if (access_token) {
      axios
        .post(
          import.meta.env.VITE_SERVER_DOMAIN + '/isliked-by-user',
          { _id },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(({ data: { result } }) => {
          // console.log(result);
          //this willl make sure d like button is turn red or otherwise
          setIsLikedByUser(Boolean(result)); //convert d result to boolean, if it's true. will b true else false
        })
        .catch((err) => {
          console.log(err);
        });
      // if user is a log in user
      //make request to server to get liked information
    }
  }, []);

  const handleLike = () => {
    // only a log in user can like
    if (access_token) {
      // console.log('liked');

      !isLikedByUser ? total_likes++ : total_likes--;
      setIsLikedByUser((preval) => !preval);

      setBlog({ ...blog, activity: { ...activity, total_likes } }); // this is how to update

      axios
        .post(
          import.meta.env.VITE_SERVER_DOMAIN + '/like-blog',
          { _id, isLikedByUser },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(({ data }) => {
          console.log(data);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      toast.error('please log in to like blog');
    }
  };

  // const handleComment =()=>{

  // }

  return (
    <>
      <Toaster />

      <hr className="border-grey my-2" />
      <div className="flex gap-6 justify-between">
        <div className="flex gap-3 items-center">
          <div className="flex gap-3 items-center">
            <button
              onClick={handleLike}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isLikedByUser ? 'bg-red/20 text-red' : 'bg-grey/80'
              }`}
            >
              <i
                className={`fi ${
                  isLikedByUser ? 'fi-sr-heart' : 'fi-rr-heart'
                }`}
              ></i>
            </button>
            <p className="text-xl text-dark-grey">{total_likes}</p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => setCommentWrapper((preVal) => !preVal)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
            >
              <i className="fi fi-rr-comment-dots"></i>
            </button>
            <p className="text-xl text-dark-grey">{total_comments}</p>
          </div>
        </div>

        <div className="flex gap-6 items-center">
          {
            //check if login user is the same as author
            username === author_username ? (
              <Link
                to={`/editor/${blog_id}`}
                className="undeline hover:text-purple"
              >
                Edit
              </Link>
            ) : (
              ''
            )
          }
          <Link
            to={`/https://twitter.com/intent/tweet?text=Read${title}&url=${location.href}`}
          >
            <i className="fi fi-brands-twitter text-xl hover:text-twitter"></i>
          </Link>
        </div>
      </div>
      <hr className="border-grey my-2" />
    </>
  );
};
export default BlogInteraction;
