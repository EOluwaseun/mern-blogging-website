import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AnimationWrapper from '../common/page-animation';
import Loader from '../components/loader.component';
import { getDay } from '../common/date';
import BlogInteraction from '../components/blog-interaction.component';
import BlogPostCard from '../components/blog-post.component';
import BlogContent from '../components/blog-content.component';
import CommentContainer, {
  fetchComments,
} from '../components/comment-card.component';

export const blogStructure = {
  title: '',
  des: '',
  banner: '',
  //   tags: [],
  author: { personal_info: {} },
  activity: {},
  content: [],
  publishedAt: '',
};

// blog context
export const BlogContext = createContext({});

const BlogPage = () => {
  let { blog_id } = useParams();

  //   const [blog, setBlog] = useState(null;
  const [blog, setBlog] = useState(blogStructure);
  const [similarBlog, setSimilarBlogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLikedByUser, setIsLikedByUser] = useState(false);
  const [commentWrapper, setCommentWrapper] = useState(false);
  const [totalParentCommentLoaded, setTotalParentCommentLoaded] = useState(0);

  let {
    title,
    // des,
    // tags,
    banner,
    content,
    author: {
      personal_info: { fullname, username: author_username, profile_img },
    },
    // activity:{},
    publishedAt,
  } = blog; //this will give error in the html cos it is null initially, NB HTML will render
  //before the function

  //this function fetches single blog from d backend
  const fetchBlog = () => {
    //This get blog
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + '/get-blog', { blog_id }) //blog ID is sent to d backend
      .then(async ({ data: { blog } }) => {
        // console.log(blog);
        // fetch d comment

        //this get blogs comments only, it is then pass to the blog's comment
        blog.comments = await fetchComments({
          //comment api fetch is passed to the blog.comments
          blog_id: blog._id,
          setParentCountFunc: setTotalParentCommentLoaded,
        });
        // setTotalParentCommentLoaded is 0 initially until comment is made
        // console.llog
        setBlog(blog);

        // FETCHING SIMILAR BLOGS before getting the blogs
        axios
          .post(import.meta.env.VITE_SERVER_DOMAIN + '/search-blogs', {
            //it is getting first tag of the blog, and then select any tag that correlate with it
            tag: blog.tags[0],
            limit: 6,
            eliminate_blog: blog_id, //this remove the current blog from similar
          })
          //sending the first tag of this blog
          .then(({ data }) => {
            setSimilarBlogs(data.blogs);
            // console.log(data.blogs);
          });

        //{data:{blog}}  => this destructure blog from data
        // console.log(blog);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    resetState();
    fetchBlog();
  }, [blog_id]);

  //reset all state whenever blog id is changed
  const resetState = () => {
    setBlog(blogStructure);
    setSimilarBlogs(null);
    setLoading(true);
    setIsLikedByUser(false);
    // setCommentWrapper(false);
    setTotalParentCommentLoaded(0);
  };

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <BlogContext.Provider
          value={{
            blog,
            setBlog,
            isLikedByUser,
            setIsLikedByUser,
            commentWrapper,
            setCommentWrapper,
            totalParentCommentLoaded,
            setTotalParentCommentLoaded,
          }}
        >
          <CommentContainer />
          <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <img src={banner} className="aspect-video" />
            <div className="mt-12">
              {/* h2 doesn't need to be styled bcos it has been styled from d published end */}
              {/* if h2 is used there, u must used h2 here too otherwise the styled will be */}
              <h2>{title}</h2>
              <div className="flex max-sm:flex-col justify-between my-8">
                <div className="flex gap-5 items-start">
                  <img src={profile_img} className="w-12 h-12 rounded-full" />

                  <p className="capitalize">
                    {fullname}
                    <br />@
                    <Link to={`/user/${author_username}`} className="underline">
                      {author_username}
                    </Link>
                  </p>
                </div>
                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                  Published on {getDay(publishedAt)}
                </p>
              </div>
            </div>

            <BlogInteraction />

            <div className="my-12 font-gelasio blog-page-content">
              {content[0]?.blocks?.map((block, i) => {
                return (
                  <div key={i} className="my-4 md:my-8">
                    <BlogContent block={block} />
                  </div>
                );
              })}
            </div>
            <BlogInteraction />
            {similarBlog != null && similarBlog.length ? (
              <>
                <h1 className="text-2xl mt-14 mb-10 font-medium">
                  Similar blogs
                </h1>
                {similarBlog.map((blog, i) => {
                  let {
                    author: { personal_info },
                  } = blog;

                  return (
                    <AnimationWrapper
                      key={i}
                      transition={{ duration: 1, delay: i * 0.08 }}
                    >
                      <BlogPostCard content={blog} author={personal_info} />
                    </AnimationWrapper>
                  );
                })}
              </>
            ) : (
              ''
            )}
          </div>
        </BlogContext.Provider>
      )}
    </AnimationWrapper>
  );
};
export default BlogPage;
