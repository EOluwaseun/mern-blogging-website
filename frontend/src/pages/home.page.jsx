import { useState, useEffect } from 'react';
import AnimationWrapper from '../common/page-animation';
import InpageNavigation, {
  activeTabRef,
} from '../components/inpage-navigation.component';
import axios from 'axios';
import Loader from '../components/loader.component';
import BlogPostCard from '../components/blog-post.component';
import MinimalBlogPost from '../components/nobanner-blog-post.component';
import NoStateMessage from '../components/nodata.component';
import { filterPaginationData } from '../common/filter-pagination-data';
import LoadMoreDataBtn from '../components/load-more.component';

/*
  initial data structure
  blogs = [{}, {},{}]

  new data structure
  blogs = {[{}], [], [], []}
*/

const HomePage = () => {
  // setting blog
  const [blogs, setBlogs] = useState(null);
  const [trendingblogs, setTrendingBlogs] = useState(null);

  //the pagesState tells wat state m in, by default it's home
  //the state will then be change to category

  let [pageState, setPageState] = useState('home');

  let categories = [
    'programming',
    'animal',
    'dog',
    'tech',
    'coding life',
    'lifestyle',
    'fashion',
  ];

  //pass your async await here too
  const fetchLatestBlogs = ({ page = 1 }) => {
    //this recieve a paramter
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + '/latest-blogs', { page })
      .then(async ({ data }) => {
        //the curly allows to destructure data and get the blogs from it
        // console.log(data.blogs);

        // setBlogs(data.blogs);

        // let's format d data
        let formatData = await filterPaginationData({
          //the initial data is the blogs we first fetch
          state: blogs,
          data: data.blogs,
          //result of the data got from this route, cos it's object i have to use DOT to acces the blogs in it
          page,
          //page is 1  by default
          countRoute: '/all-latest-blog-count',
          //counteroute is the route where the filter pagination can make a request
        });
        setBlogs(formatData);
        // console.log(formatData);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchBlogCategory = ({ page = 1 }) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + '/search-blogs', {
        tag: pageState,
        page,
      }) /*the data i am sending is current pageCategory, tag is the key representing it*/
      .then(async ({ data }) => {
        // let's format d data
        let formatData = await filterPaginationData({
          //the initial data is the blogs we first fetch
          state: blogs,
          data: data.blogs,
          //result of the data got from this route, cos it's object i have to use DOT to acces the blogs in it
          page,
          //page is 1  by default
          countRoute: '/search-blogs-count', //seding our request to search blog
          data_to_send: { tag: pageState }, //this allows me to filter by tag
          //counteroute is the route where the filter pagination can make a request
        });
        setBlogs(formatData);
        // setBlogs(data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchTrendingBlogs = () => {
    //make d trending blogs post request
    //in d body, i'm sending the page which is 1 by default
    axios
      .get(import.meta.env.VITE_SERVER_DOMAIN + '/trending-blogs')
      .then(({ data }) => {
        //the curly allows to destructure data and get the blogs from it
        // console.log(data.blogs);
        setTrendingBlogs(data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadBlogByCategory = (e) => {
    //the target is the category
    //programmin, tech e.tc are known as category
    let category = e.target.innerText.toLowerCase();

    //first set whatever blog we have to null, b4 fetching by category
    //this will basically turn on the loader cos its null
    setBlogs(null);

    //this means if pageState is equal to either programmin or tech and so ..
    //set the blog back from null
    if (pageState === category) {
      setPageState('home');
      return;
      //this return will stop d function from running againg if this is true
      //means dont set to null again
    }
    //otherwise set page state to that category
    setPageState(category);
  };

  useEffect(() => {
    //this will automatically click and move the hr as order
    // cos if it's not cliked, it cant be move
    activeTabRef.current.click();

    if (pageState === 'home') {
      //this means fetch only if page state is equal to home
      // if the pagestate is categories, it won't refetch
      fetchLatestBlogs({ page: 1 });
    } else {
      // otherwise
      fetchBlogCategory({ page: 1 });
    }
    if (!trendingblogs) {
      fetchTrendingBlogs();
      // if trending blogs is truly a null
    }
    //run this function only once, when the pages loads

    //refetch the trndingBlogs and latest blog only when d pageState changes
    //but dont fetch everytime it changes unless on some conditions
  }, [pageState]);
  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        {/* latest blog */}
        <div className="w-full">
          <InpageNavigation
            //   pageState holds value of home and other target from category
            routes={[pageState, 'trending blogs']}
            defaultHidden={['trending blogs']}
          >
            <>
              {blogs === null ? (
                <Loader />
              ) : blogs.results.length ? (
                blogs.results.map((blog, i) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: i * 0.1 }}
                      key={i}
                    >
                      <BlogPostCard
                        content={blog}
                        author={blog.author.personal_info}
                      />
                    </AnimationWrapper>
                  );
                })
              ) : (
                <NoStateMessage message={'No blogs published'} />
              )}
              <LoadMoreDataBtn
                state={blogs}
                fetchMoreData={
                  pageState === 'home' ? fetchLatestBlogs : fetchBlogCategory
                }
              />
            </>

            {trendingblogs === null ? (
              <Loader />
            ) : (
              trendingblogs.map((blog, i) => {
                return (
                  <AnimationWrapper
                    transition={{ duration: 1, delay: i * 0.1 }}
                    key={i}
                  >
                    <MinimalBlogPost blog={blog} index={i} />
                  </AnimationWrapper>
                );
              })
            )}
          </InpageNavigation>
        </div>

        {/* latest and trending */}
        <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
          <div className="flex flex-col gap-10">
            <div>
              <h1 className="font-medium text-xl mb-8">Stories from all</h1>
              <div className="flex gap-3 flex-wrap">
                {categories.map((category, i) => {
                  return (
                    <button
                      key={i}
                      className={`tag ${
                        pageState === category ? 'bg-black text-white' : ''
                      }`}
                      onClick={loadBlogByCategory}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h1 className="font-medium text-xl mb-8">
                Trending<i className="fi fi-rr-arrow-trend-up"></i>
              </h1>
              {trendingblogs === null ? (
                <Loader />
              ) : trendingblogs.length ? (
                trendingblogs.map((blog, i) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: i * 0.1 }}
                      key={i}
                    >
                      <MinimalBlogPost blog={blog} index={i} />
                    </AnimationWrapper>
                  );
                })
              ) : (
                <NoStateMessage message={'No trending blogs'} />
              )}
            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default HomePage;
