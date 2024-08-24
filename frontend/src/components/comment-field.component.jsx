import { useContext, useState } from 'react';
import { UserContext } from '../App';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { BlogContext } from '../pages/blog.page';

const CommentField = ({ action }) => {
  const {
    userAuth: { access_token, username, fullname, profile_img },
  } = useContext(UserContext);

  let {
    blog,
    blog: {
      _id,
      author: { _id: blog_author },
      comments,
      activity,
      activity: { total_comments, total_parent_comments },
    },
    setBlog,
    setTotalParentCommentLoaded,
  } = useContext(BlogContext);

  const [comment, setComment] = useState('');

  const handleComment = () => {
    if (!access_token) {
      return toast.error('login first to leave a comment...');
    }
    if (!comment.length) {
      return toast.error('write something to leave a comment...');
    }

    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + '/add-comment',
        {
          _id,
          blog_author,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(({ data }) => {
        // console.log(data);
        // render componet card
        setComment('');

        data.commented_by = {
          //passing user details from d frontend
          personal_info: { username, profile_img, fullname }, //sending d user details to d backend
        };

        let newCommentArray;

        //HOW IS CHILDREN LEVEL CREATED
        //childrenLeve is also pass through from d frontend
        data.childrenLevel = 0; //if children level is zero, that means it is a parent comment, else it is reply
        //if children is 1 = it means is a first reply to d parent comment
        //if children is 2 = it means is a second reply to d parent comment

        newCommentArray = [data]; //whatever d comment is data will b d first comment... PARENT COMMENT

        let parentCommentIncrementval = 1; // it means i'm commenting to update d parent state value of the comment

        //UPDATE THE COMMENTS INTO YOUR BLOG
        setBlog({
          ...blog,
          comments: { ...comments, results: newCommentArray },
          activity: {
            ...activity,
            total_comments: total_comments + 1,
            total_parent_comments:
              total_parent_comments + parentCommentIncrementval,
            // increament comment and it's parent by 1
          },
        }); //comments is destructure from d blog so as to update it
        //PARENT COMMENT was used to update d blog

        //total parent Loaded is a state, which was initially 0
        setTotalParentCommentLoaded(
          //if total parent comment is 1, it will be set in setTotalParentComment, and so on ...
          (preVal) => preVal + parentCommentIncrementval
        );
        //add 1 to previous value
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <>
      <Toaster />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)} //get value from d text area
        placeholder="Leave a comment..."
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
      ></textarea>
      <button onClick={handleComment} className="btn-dark mt-5 px-10">
        {action}
      </button>
    </>
  );
};
export default CommentField;
