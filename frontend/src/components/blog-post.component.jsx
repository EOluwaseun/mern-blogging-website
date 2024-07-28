import { Link } from 'react-router-dom';
import { getDay } from '../common/date';

const BlogPostCard = ({ content, author }) => {
  let {
    blog_id: id,
    publishedAt,
    tags,
    title,
    des,
    banner,
    activity: { total_likes },
  } = content;
  let { fullname, profile_img, username } = author;
  return (
    <Link
      // this will take me to id of the blog
      to={`/blog/${id}`}
      className="flex gap-8 items-center border border-grey pb-5 mb-4"
    >
      <div className="w-full">
        <div className="flex gap-2 items-center mb-2">
          <img
            src={profile_img}
            className="w-6 h-6 rounded-full"
            loading="lazy"
          />
          <p className="line-clamp-1">
            {fullname} @{username}
          </p>
          <p className="min-w-fit">{getDay(publishedAt)}</p>
        </div>
        <h1 className="blog-title">{title}</h1>
        <p className="my-3 text-xl font-gelasio leading-7 max-sm:hidden md:max-[1100px]:hidden line-clamp-2">
          {des}
        </p>
        <div className="flex gap-4 mt-7 mb-2">
          <span className="btn-light px-4 py-1">{tags[0]}</span>
          <span className="flex items-center gap-2 ml-3 text-dark ">
            <i className="fi fi-rr-heart text-xl"></i>
            {total_likes}
          </span>
        </div>
      </div>
      {/* aspct squres will make d image does not shrink even when it is wrap in flex box */}
      <div className="h-28 aspect-square bg-grey">
        <img
          src={banner}
          className="w-full h-full aspect-square object-cover"
          loading="lazy"
        />
      </div>
    </Link>
  );
};
export default BlogPostCard;
