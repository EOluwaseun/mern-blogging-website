import { useContext, useState } from 'react';
import { getDay } from '../common/date';
import { UserContext } from '../App';
import toast, { Toaster } from 'react-hot-toast';
import CommentField from './comment-field.component';
import { BlogContext } from '../pages/blog.page';

const CommentCard = ({ index, leftVal, commentData }) => {
  // get user data
  let {
    _id,
    commented_by: {
      personal_info: { profile_img, fullname, username },
    },
    commentedAt,
    comment,
    children,
  } = commentData;

  let {
    blog,
    blog: {
      comments: { results: commentArr },
    },
    setBlog,
  } = useContext(BlogContext);

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  const [isReplying, setIsReplying] = useState(false);

  const removeCommentsCards = (startingPoint) => {
    if (commentArr[startingPoint]) {
      while (
        commentArr[startingPoint].childrenLevel > commentData.childrenLevel
      ) {
        commentArr.splice(startingPoint, 1);

        if (!commentArr[startingPoint]) {
          break;
        }
      }
    }
    setBlog({ ...blog, comments: { results: commentArr } });
  };

  const loadReplies = ({ skip = 0 }) => {
    if (children.length) {
    }
  };

  const hideReplies = () => {
    commentData.isReplyLoaded = false;

    removeCommentsCards(index + 1);
  };

  const handleReplyClick = () => {
    if (!access_token) {
      return toast.error('login first to leave a reply');
    }

    setIsReplying((preVal) => !preVal);
  };

  return (
    <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
      <div className="my-5 p-6 rounded-md border border-grey">
        <div className="flex gap-3 items-center mb-8">
          <img src={profile_img} className="h-6 w-6 rounded-full" />

          <p className="line-clamp-1">
            {fullname}@{username}
          </p>
          <p className="min-w-fit">{getDay(commentedAt)}</p>
        </div>

        <p className="text-xl font-gelasio ml-3">{comment}</p>

        <div className="flex fap-5 items-center mt-5">
          {
            //isReplyLoaded is the key that was passed and set to true
            commentData.isReplyLoaded ? (
              <button
                onClick={hideReplies}
                className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items gap-2"
              >
                <i className="fi fi-rs-comment-dots"></i> Hide Replies
              </button>
            ) : (
              <button
                onClick={loadReplies}
                className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items gap-2"
              >
                <i className="fi fi-rs-comment-dots"></i>
                {children.length} Reply
              </button>
            )
          }

          <button className="underline" onClick={handleReplyClick}>
            Reply
          </button>
        </div>
        {isReplying ? (
          <div className="mt-8">
            <CommentField
              action={'reply'}
              index={index}
              replyingTo={_id}
              setIsReplying={setIsReplying}
            />
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};
export default CommentCard;
