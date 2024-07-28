import { useParams } from 'react-router-dom';
import InpageNavigation from '../components/inpage-navigation.component';
import { useEffect, useState } from 'react';
import Loader from '../components/loader.component';
import AnimationWrapper from '../common/page-animation';
import BlogPostCard from '../components/blog-post.component';
import NoStateMessage from '../components/nodata.component';
import LoadMoreDataBtn from '../components/load-more.component';
import axios from 'axios';
import { filterPaginationData } from '../common/filter-pagination-data';
import UserCard from '../components/usercard.component';

const SearchPage = () => {
  let { query } = useParams(); //this is used to retrieve :ID from query

  const [blogs, setBlogs] = useState(null);
  const [users, setUsers] = useState(null);

  const searchBlogs = ({ page = 1, create_new_arr = false }) => {
    //page is 1 by default in other to paginate
    //data_to_send is the previous data
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + '/search-blogs', {
        query,
        page,
      })
      //i'm sending d QUERY AND PAGE to the server
      //once this is resolved, i wil use .then
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
          countRoute: '/search-blogs-count',
          //counteroute is the route where the filter pagination can make a request
          data_to_send: { query },
          create_new_arr,
        });
        setBlogs(formatData);
        // console.log(formatData);
      });
  };

  const fetchUsers = () => {
    axios
      .post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-users`, { query })
      //what i'm sending is d query
      //after getting d result from backend, i will destructure
      .then(({ data: { users } }) => {
        setUsers(users);
        console.log(users);
      });
  };

  useEffect(() => {
    //Reset state function will reset all the state will have
    //whenever d query is run, i will remove all blogs in d state
    resetState();
    searchBlogs({ page: 1, create_new_arr: true }); //alaways remember to pass your parameter when send your page
    fetchUsers();
  }, [query]); //i want to run this only when the query changes
  //cos if i type, then change what i type i will need it to rerun
  //setting create_new_array to true everytime query changes means it won't re-render old data as not get duplicate, but to create a new data

  const resetState = () => {
    setBlogs(null);
    setUsers(null);
  };

  const UserCardWrapper = () => {
    return (
      <>
        {users === null ? (
          <Loader />
        ) : users.length ? (
          users.map((user, i) => {
            return (
              <AnimationWrapper
                key={i}
                transition={{ duration: 1, delay: i * 0.08 }}
              >
                <UserCard user={user} />
              </AnimationWrapper>
            );
          })
        ) : (
          <NoStateMessage message={'No user found'} />
        )}
      </>
    );
  };

  return (
    <section className="h-cover flex justify-center gap-10">
      <div className="w-full">
        <InpageNavigation
          routes={[`Search Results from "${query}"`, 'Accounts Matched']}
          defaultHidden={['Accounts Matched']}
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
            <LoadMoreDataBtn state={blogs} fetchMoreData={searchBlogs} />
          </>

          <UserCardWrapper />
        </InpageNavigation>
      </div>
      <div className="lg:min-w-[350px] min-w-[40%] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden">
        <h1 className="font-medium text-xl mb-8">
          User related to search <i className="fi fi-rr-user mt-1"></i>
        </h1>
        <UserCardWrapper />
      </div>
    </section>
  );
};

export default SearchPage;
