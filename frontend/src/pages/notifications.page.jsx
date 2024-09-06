import axios from 'axios';
import { useContext, useState } from 'react';
import { UserContext } from '../App';
import { filterPaginationData } from '../common/filter-pagination-data';

const Notifications = () => {
  let {
    userAuth: { access_token },
  } = useContext(UserContext);
  //filter button

  const [filter, setFilter] = useState('all');

  let filters = ['all', 'like', 'comment', 'reply'];

  const fetchNotification = ({ page, deletedDocCount = 0 }) => {
    axios
      .post(
        import.meta.env.VITE.SERVER_DOMAIN + '/new-notification',
        { page, filter, deletedDocCount },
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      )
      .then(({ data: { notifications: data } }) => {
        let formatedData = filterPaginationData();
      });
  };

  const handleFilterFunc = (e) => {
    let btn = e.target;

    setFilter(btn.textContent);
  };

  return (
    <div>
      <h1 className="max-md:hidden">Recent Notifications</h1>

      <div className="my-8 flex gap-6">
        {filters.map((filterName, i) => {
          return (
            <button
              className={`py-2 ${
                filter === filterName ? 'btn-dark' : 'btn-light'
              }`}
              key={i}
              onClick={handleFilterFunc}
            >
              {filterName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default Notifications;
