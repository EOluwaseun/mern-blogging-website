import { useContext } from 'react';
import { BlogContext } from '../pages/blog.page';
import CommentField from './comment-field.component';
import axios from 'axios';
import NoStateMessage from './nodata.component';
import AnimationWrapper from '../common/page-animation';
import CommentCard from './comments.component';

//fetching comment
//this function will be called, immidiately the blog is loaded
export const fetchComments = async ({
  blog_id,
  setParentCountFunc,
  skip = 0,
  comment_arr = null,
}) => {
  let res;

  await axios
    .post(import.meta.env.VITE_SERVER_DOMAIN + '/get-blog-comments', {
      blog_id,
      skip,
    })
    .then(({ data }) => {
      // console.log(data);
      data.map((comment) => {
        //map d comment and pass childrenLevel = 0 to it
        comment.childrenLevel = 0; //get the parent comment
      });

      setParentCountFunc((preVal) => preVal + data.length);

      if (comment_arr === null) {
        //if no comment is made, leave d comment section as it is
        res = { results: data };
      } else {
        //if there is additional comment, destructure and add more comment
        res = { results: [...comment_arr, ...data] };
      }
    });

  return res;
};

const CommentContainer = () => {
  let {
    blog,
    blog: {
      _id,
      title,
      comments: { results: commentsArr },
      activity,
      activity: { total_parent_comments }, //total comment in d database
    },
    setBlog,
    commentWrapper,
    setCommentWrapper,
    totalParentCommentLoaded,
    setTotalParentCommentLoaded,
  } = useContext(BlogContext);

  // console.log(commentsArr);

  const loadMoreFunc = async () => {
    //this will create new comment array to load more
    let newCommentsArray = await fetchComments({
      skip: totalParentCommentLoaded, //comment that is loaded
      blog_id: _id,
      setParentCountFunc: setTotalParentCommentLoaded,
      comment_arr: commentsArr,
    });

    //update it in the UI
    setBlog({ ...blog, comments: newCommentsArray });
  };

  return (
    <div
      className={`max-sm:w-full fixed ${
        commentWrapper ? 'top-0 sm:right-0' : 'top-[100%] sm:right-[-100%]'
      } duration-700 max-sm:right-0 sm:top-0 w-[30%] min-w-[350px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-auto overflow-x-hidden`}
    >
      <div className="relative">
        <h1 className="text-xl font-medium">Comments</h1>
        <p className="text-lg mt-2 w-[70%] text-dark-grey line-clamp-1">
          {title}
        </p>
        <button
          onClick={() => setCommentWrapper((preVal) => !preVal)}
          className="absolute top-0 right-0 flex justify-center items-center w-12 h-12 rounded-full bg-grey"
        >
          <i className="fi fi-br-cross text-2xl mt-1"></i>
        </button>
      </div>
      <hr className="border-grey my-8 w-[120%] -ml-10" />

      <CommentField action={'Comment'} />

      {/* render comment */}
      {commentsArr && commentsArr.length ? (
        commentsArr.map((comment, i) => {
          return (
            <AnimationWrapper key={i}>
              <CommentCard
                index={i}
                leftVal={comment.childrenLevel * 4}
                commentData={comment}
              />
            </AnimationWrapper>
          );
        })
      ) : (
        <NoStateMessage message={'No Comment'} />
      )}

      {total_parent_comments > totalParentCommentLoaded ? (
        <button
          onClick={loadMoreFunc}
          className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
        >
          Load More
        </button>
      ) : (
        ''
      )}
    </div>
  );
};

export default CommentContainer;
