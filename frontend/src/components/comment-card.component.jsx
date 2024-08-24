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
      title,
      comments: { results: commentsArr },
    },
    commentWrapper,
    setCommentWrapper,
  } = useContext(BlogContext);

  // console.log(commentsArr);
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
              <CommentCard />
            </AnimationWrapper>
          );
        })
      ) : (
        <NoStateMessage message={'No Comment'} />
      )}
    </div>
  );
};

export default CommentContainer;
