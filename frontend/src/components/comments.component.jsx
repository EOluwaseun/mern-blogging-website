import { useContext, useState } from 'react';
import { getDay } from '../common/date';
import { UserContext } from '../App';
import toast, { Toaster } from 'react-hot-toast';
import CommentField from './comment-field.component';
import { BlogContext } from '../pages/blog.page';
import axios from 'axios';

const CommentCard = ({ index, leftVal, commentData }) => {
  // get user data
  let {
    _id,
    commented_by: {
      personal_info: { profile_img, fullname, username: commented_by_username },
    },
    commentedAt,
    comment,
    children,
  } = commentData;

  let {
    blog,
    blog: {
      comments,
      activity,
      activity: { total_parent_comments },
      comments: { results: commentArr },
      author: {
        personal_info: { username: blog_author },
      },
    },
    setBlog,
    setTotalParentCommentLoaded,
  } = useContext(BlogContext);

  let {
    userAuth: { access_token, username },
  } = useContext(UserContext);

  const [isReplying, setIsReplying] = useState(false);

  //get parentIndex of any replies
  const getParentIndex = () => {
    let startingPoint = index - 1; //this means any replie deleted, get it's parent

    try {
      while (
        commentArr[startingPoint].childrenLevel >= commentData.childrenLevel
        //this means if one b4 before the childrenLeve is greater than current childrenLevel
      ) {
        startingPoint--;
      }
    } catch {
      startingPoint = undefined;
    }

    return startingPoint;
  };

  const removeCommentsCards = (startingPoint, isDelete = false) => {
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

    if (isDelete) {
      let parentIndex = getParentIndex();

      if (parentIndex != undefined) {
        commentArr[parentIndex].children = commentArr[
          parentIndex
        ].children.filter((child) => child != _id);

        if (!commentArr[parentIndex].children.length) {
          commentArr[parentIndex].isReplyLoaded = false;
        }
      }

      commentArr.splice(index, 1);
    }

    if (commentData.childrenLevel == 0 && isDelete) {
      setTotalParentCommentLoaded((preVal) => !preVal - 1);
    }

    setBlog({
      ...blog,
      comments: { results: commentArr },
      activity: {
        ...activity,
        total_parent_comments:
          total_parent_comments -
          (commentData.childrenLevel === 0 && isDelete ? 1 : 0),
      },
    });
  };

  const loadReplies = ({ skip = 0, currentIndex = index }) => {
    if (commentArr[currentIndex].children.length) {
      hideReplies(); // replies
      axios
        .post(import.meta.env.VITE_SERVER_DOMAIN + '/get-replies', {
          _id: commentArr[currentIndex]._id,
          skip,
        })
        .then(({ data: { replies } }) => {
          //after getting d replies, i want to insert it in between the parent comment array
          commentArr[currentIndex].isReplyLoaded = true; //select current comment card

          //use for loop for d replies
          for (let i = 0; i < replies.length; i++) {
            //add childrenLeve key to the reply
            replies[i].childrenLevel =
              commentArr[currentIndex].childrenLevel + 1; //if the children level of the comment is 0, it store d childrenLevel of the reply to 1

            //add the reply data into comments array

            commentArr.splice(currentIndex + 1 + i + skip, 0, replies[i]); //use splice to cut it from where i want it to be inserted
            // index + 1 + i + 1, 0, replies[i]  ///
            //d index of the comment + 1
            // i the index of the reply
            //skip incase we're skipping any reply before splicing d array
            // 0 means i'm not removing anyhting but insert
          }
          //render it to the UI
          setBlog({ ...blog, comments: { ...comments, results: commentArr } });
          //the result will be comment Array that i just splice
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const deleteComment = (e) => {
    e.target.setAttribute('disabled', true);

    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + '/delete-comment',

        {
          _id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(() => {
        e.target.removeAttribute('disabled');
        //remove d comment from UI
        removeCommentsCards(index + 1, true);
      })
      .catch((err) => {
        console.log(err);
      });
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

  const LoadMoreRepliesButton = () => {
    let parentIndex = getParentIndex();

    const button = (
      <button
        onClick={() =>
          loadReplies({
            skip: index - parentIndex,
            currentIndex: parentIndex,
          })
        }
        className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center"
      >
        Load More Replies{' '}
      </button>
    );

    if (commentArr[index + 1]) {
      //if i have any other element after this comment
      if (
        commentArr[index + 1].childrenLevel < commentArr[index].childrenLevel
      ) {
        //commentArr[index + 1].childrenLevel   comment

        //commentArr[index].childrenLevel   replies

        if (index - parentIndex < commentArr[parentIndex].children.length) {
          return button;
        }
      }
    } else {
      if (parentIndex) {
        if (index - parentIndex < commentArr[parentIndex].children.length) {
          return button;
        }
      }
    }
  };

  return (
    <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
      <div className="my-5 p-6 rounded-md border border-grey">
        <div className="flex gap-3 items-center mb-8">
          <img src={profile_img} className="h-6 w-6 rounded-full" />

          <p className="line-clamp-1">
            {fullname}@{commented_by_username}
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
          {
            //this means if d login user made the comment
            username == commented_by_username || username == blog_author ? (
              //   if i'm d author of the blog, i can delete d comment
              <button
                className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red flex items-center"
                onClick={deleteComment}
              >
                <i className="fi fi-rr-trash pointer-events-none"></i>
              </button>
            ) : (
              ''
            )
          }
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
      <LoadMoreRepliesButton />
    </div>
  );
};
export default CommentCard;
