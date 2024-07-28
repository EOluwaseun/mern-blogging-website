import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AnimationWrapper from '../common/page-animation';
import Loader from '../components/loader.component';
import { UserContext } from '../App';
import AboutUser from '../components/about.component';
import { filterPaginationData } from '../common/filter-pagination-data';
import InpageNavigation from '../components/inpage-navigation.component';
import BlogPostCard from '../components/blog-post.component';
import NoStateMessage from '../components/nodata.component';
import LoadMoreDataBtn from '../components/load-more.component';
import PageNotFound from './404.page';

export const ProfileDataStructure = {
  personal_info: {
    fullname: '',
    username: '',
    profile_img: '',
    bio: '',
  },
  account_info: {
    total_posts: 0,
    total_reads: 0,
  },
  social_links: {},
  joinedAt: '',
};

const ProfilePage = () => {
  let { id: profileId } = useParams();
  //id is rename to profileId

  let [profile, setProfile] = useState(ProfileDataStructure);
  let [loading, setLoading] = useState(true);
  let [blogs, setBlogs] = useState(null);
  let [profileLoaded, setProfileLoaded] = useState('');

  let {
    personal_info: { fullname, username: profile_username, profile_img, bio },
    account_info: { total_posts, total_reads },
    social_links,
    joinedAt,
  } = profile;

  let {
    userAuth: { username },
  } = useContext(UserContext);

  const fetchUserProfile = () => {
    axios
      .post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-profile`, {
        username: profileId,
      })
      .then(({ data: user }) => {
        // set user only if user is available otherwise don't
        if (user != null) {
          setProfile(user);
        }
        setProfileLoaded(profileId);
        getBlogs({ user_id: user._id });
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  //get Blogs
  const getBlogs = ({ page = 1, user_id }) => {
    user_id = user_id === undefined ? blogs.user_id : user_id;
    //update users
    axios
      .post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-blogs`, {
        author: user_id,
        page,
      })
      .then(async ({ data }) => {
        let formatData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute: '/search-blogs-count',
          data_to_send: { author: user_id },
        });

        formatData.user_id = user_id;
        console.log(formatData);
        setBlogs(formatData);
      });
  };

  useEffect(() => {
    if (profileId != profileLoaded) {
      setBlogs(null);
    }

    if (blogs === null) {
      resetState();
      fetchUserProfile();
    }
  }, [profileId, blogs]); //blogs and profileId changes

  const resetState = () => {
    setProfile(ProfileDataStructure);
    setLoading(true);
    setProfileLoaded('');
  };

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : // check if d user is availableb before rendering
      profile_username.length ? (
        <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
          <div
            className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:min-[50%] md:pl-8 md:border-1
          border-grey md:sticky md:top-[100px] md:py-10"
          >
            <img
              src={profile_img}
              className="md:w-32 md:h-32 h-48 w-48 bg-grey rounded-full"
            />
            <h1 className="text-2xl font-medium">@{profile_username}</h1>
            <p className="text-xl capitalize h-6">{fullname}</p>

            <p>
              {total_posts.toLocaleString()} Blogs{' '}
              {total_reads.toLocaleString()} Reads
            </p>
            <div className="flex gap-4 mt-2">
              {profileId === username ? (
                <Link
                  to={'/settings/edit-profile'}
                  className="btn-light rounded-md"
                >
                  Edit Profile
                </Link>
              ) : (
                ''
              )}
              {/* 
              {console.log(username) //eoluwaloseun
              console.log(profileId) //admin

              
              } */}
            </div>
            <AboutUser
              className={'max-md:hidden'}
              bio={bio}
              social_links={social_links}
              joinedAt={joinedAt}
            />
          </div>

          <div className="max-md:mt-12 w-full">
            <InpageNavigation
              //   pageState holds value of home and other target from category
              routes={['Blogs published', 'About']}
              defaultHidden={['About']}
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
                <LoadMoreDataBtn state={blogs} fetchMoreData={getBlogs} />
              </>
              <AboutUser
                bio={bio}
                social_links={social_links}
                joinedAt={joinedAt}
              />
            </InpageNavigation>
          </div>
        </section>
      ) : (
        <PageNotFound />
      )}
    </AnimationWrapper>
  );
};
export default ProfilePage;
