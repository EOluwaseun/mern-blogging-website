import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../App';
import { filterPaginationData } from '../common/filter-pagination-data';
import { Toaster } from 'react-hot-toast';
import InpageNavigation from '../components/inpage-navigation.component';
import Loader from '../components/loader.component';
import NoStateMessage from '../components/nodata.component';
import AnimationWrapper from '../common/page-animation';
import {
  ManageBlogCard,
  ManageDraftPost,
} from '../components/manage-blogcard.component';

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [query, setQuery] = useState('');

  let {
    userAuth,
    userAuth: { access_token, new_notification_available },
    setUserAuth,
  } = useContext(UserContext);

  const handleSearch = (e) => {
    let searchQuery = e.target.value;

    setQuery(searchQuery);

    if (e.keyCode == 13 && setQuery.length) {
      setBlogs(null);
      setDrafts(null);
    }
  };
  const handleChange = (e) => {
    if (!e.target.value.length) {
      setQuery('');
      setBlogs(null);
      setDrafts(null);
    }
  };

  const getBlogs = ({ page, draft, deletedDocCount = 0 }) => {
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + '/user-written-blogs',
        {
          page,
          draft,
          query,
          deletedDocCount,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(async ({ data }) => {
        let formatedData = await filterPaginationData({
          state: draft ? drafts : blogs,
          data: data.blogs,
          page,
          user: access_token,
          countRoute: '/user-written-blogs-count',
          data_to_send: { draft, query },
        });
        // console.log(formatedData);
        if (draft) {
          setDrafts(formatedData);
        } else {
          setBlogs(formatedData);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (access_token) {
      if (blogs === null) {
        getBlogs({ page: 1, draft: false });
      }
      if (drafts === null) {
        getBlogs({ page: 1, draft: true });
      }
    }
  }, [access_token, blogs, drafts, query]);

  return (
    <>
      <h1 className="max-md:hidden">Manage Blogs</h1>
      <div className="relative max-md:mt-5 md:mt-8 mb-10">
        <input
          type="search"
          className="w-full bg-grey p-4 pl-12 p-4 pr-6 rounded-full placeholder:text-dark-grey"
          placeholder="search Blogs"
          onChange={handleChange}
          onKeyDown={handleSearch}
        />
        <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
      </div>
      <InpageNavigation routes={['Published Blogs', 'Drafts']}>
        {blogs === null ? (
          <Loader />
        ) : blogs.results.length ? (
          <>
            {blogs.results.map((blog, i) => {
              return (
                <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                  <ManageBlogCard blog={blog} />
                </AnimationWrapper>
              );
            })}
          </>
        ) : (
          <NoStateMessage message="No published blogs" />
        )}

        {/* draft */}
        {drafts === null ? (
          <Loader />
        ) : drafts.results.length ? (
          <>
            {drafts.results.map((blog, i) => {
              return (
                <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                  <ManageDraftPost blog={blog} index={i + 1} />
                </AnimationWrapper>
              );
            })}
          </>
        ) : (
          <NoStateMessage message="No draft blogs" />
        )}
      </InpageNavigation>
    </>
  );
};

export default ManageBlogs;
