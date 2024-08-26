import { useContext, useState } from 'react';
import { UserContext } from '../App';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { BlogContext } from '../pages/blog.page';

const CommentField = ({
  action,
  index = undefined,
  replyingTo = undefined,
  setIsReplying,
}) => {
  //how this process Reply differently
  /*index is psssed in other to break d array from the particular index
  so as to insert d reply inbetween
  - Replying will be the ID of the comment so as to know d comment we're replying to
  Set the both index and isReply to undefined
  - setIsReplying is state that hide the textArea after d reply is render
  */

  const {
    userAuth: { access_token, username, fullname, profile_img },
  } = useContext(UserContext);

  let {
    blog,
    blog: {
      _id,
      author: { _id: blog_author },
      comments,
      comments: { results: commentArr },
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
        /*
        Tell d server if d comment is a reply or parentComment
        - replying_to => this will equal to d -ID of the comment i want reply on
        //check replyingTo if it is undefined or not
        */
        {
          _id,
          blog_author,
          comment,
          replying_to: replyingTo,
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

        if (replyingTo) {
          //get d index of the comment DOC
          //also i am pushing d reply ID in to the children Array
          commentArr[index].children.push(data._id);

          //if i'm replying to a comment 1 will be added to the childrenLeve
          //otherwise it will be 0
          //the reply will be 1 + the childrenLeve 1 making 2 and so on ...
          data.childrenLevel = commentArr[index].childrenLevel + 1;

          data.parentIndex = index; //this will keep track of the comment index incase i want to delete d comment

          commentArr[index].isReplyLoaded = true; //isReplyLoaded is key added to this comment on which i'm replying
          //the Boolean will be use to check wether to show the reply card ot not

          commentArr.splice(index + 1, 0, data); //this will keep track of every index of the comment and insert their reply in order

          newCommentArray = commentArr;

          //set the commentField to false
          setIsReplying(false);
        } else {
          //HOW IS CHILDREN LEVEL CREATED
          //childrenLeve is also pass through from d frontend
          data.childrenLevel = 0; //if children level is zero, that means it is a parent comment, else it is reply
          //if children is 1 = it means is a first reply to d parent comment
          //if children is 2 = it means is a second reply to d parent comment

          //this update new comment, and destructure d ones
          newCommentArray = [data, ...commentArr]; //whatever d comment is data will b d first comment... PARENT COMMENT
        }

        let parentCommentIncrementval = replyingTo ? 0 : 1; // it means i'm commenting to update d parent state value of the comment

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
