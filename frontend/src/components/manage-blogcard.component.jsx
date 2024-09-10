import { Link } from 'react-router-dom';
import { getDay } from '../common/date';
import { useState } from 'react';

const BlogStat = ({ stat }) => {
  return (
    <div className="flex gap-2 max-lg:col max-lg:border-b mb-6 pb-6 border-grey">
      {Object.keys(stat).map((key, i) => {
        return !key.includes('parent') ? (
          <div
            key={i}
            className={`flex flex-col items-center w-full 
                h-full justify-center p-4 px-6 ${
                  i != 0 ? 'border-grey border-l' : ''
                }`}
          >
            <h1 className="mx-lg:text-dark-grey capitalize">
              {stat[key].toLocaleString()}
            </h1>
            <p>{key.split('_')[1]}</p>
          </div>
        ) : (
          ''
        );
      })}
    </div>
  );
};

export const ManageBlogCard = ({ blog }) => {
  let { banner, blog_id, title, publishedAt, activity } = blog;

  let [showStat, setShowStat] = useState(false);

  console.log(showStat);

  return (
    <>
      <div className="flex gap-10 border-b mb-6 max-md:px-4 border-grey p-6 items-center">
        <img
          src={banner}
          className="max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover"
        />
        <div className="flex flex-col justify-between py-2 w-full min-w-[300px]">
          <div>
            <Link
              to={`/blog/${blog_id}`}
              className="blog-title mb-4 hover:underline"
            >
              {title}
            </Link>
            <p className="line-clamp-1">Published on {getDay(publishedAt)}</p>
          </div>
          <div className="flex gap-6 mt-3">
            <Link to={`/editor/${blog_id}`} className="pr-4 py-2 underline">
              Edit
            </Link>
            <button
              className="lg:hidden pr-4 py-2 underline"
              onClick={() => setShowStat((preVal) => !preVal)}
            >
              Stats
            </button>
            <button className="pr-4 py-2 underline text-red">Delete</button>
          </div>
        </div>
        <div className="max-lg:hidden">
          <BlogStat stat={activity} />
        </div>
      </div>
      {showStat ? (
        <div className="lg:hidden">
          <BlogStat stat={activity} />
        </div>
      ) : (
        ''
      )}
    </>
  );
};

export const ManageDraftPost = ({ blog, index }) => {
  let { title, des, blog_id } = blog;
  return (
    <div className="flex gap-5 lg:gap-10 pb-6 border-b mb-6 border-grey">
      <h1 className="blog-index text-center pl-4 md:pl-6 flex-none">
        {index < 10 ? '0' + index : index}
      </h1>
      <div>
        <h1 className="blog-title mb-3">{title}</h1>
        <p className="line-clamp-2">{des.length ? des : 'No Description'}</p>

        <div className="flex gap-6 mt-3">
          <Link to={`/editor/${blog_id}`} className="pr-4 py-2 underline">
            Edit
          </Link>
          <button className="pr-4 py-2 underline text-red">Delete</button>
        </div>
      </div>
    </div>
  );
};
