import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../App';
import { filterPaginationData } from '../common/filter-pagination-data';
import Loader from '../components/loader.component';
import AnimationWrapper from '../common/page-animation';
import NoStateMessage from '../components/nodata.component';
import NotificationCard from '../components/notification-card.component';
import LoadMoreDataBtn from '../components/load-more.component';

const Notifications = () => {
  let {
    userAuth: { access_token },
  } = useContext(UserContext);
  //filter button

  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(null);

  let filters = ['all', 'like', 'comment', 'reply'];

  const fetchNotification = ({ page, deletedDocCount = 0 }) => {
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + '/notifications',
        { page, filter, deletedDocCount },
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      )
      .then(async ({ data: { notifications: data } }) => {
        let formatedData = await filterPaginationData({
          state: notifications,
          data,
          page,
          countRoute: '/all-notifications-count',
          data_to_send: { filter },
          user: access_token,
        });
        setNotifications(formatedData);
        console.log(formatedData);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (access_token) {
      //call notionfition whenever d page is changed/reload, or filter is change, or access_token is change
      fetchNotification({ page: 1 });
    }
  }, [access_token, filter]);

  const handleFilterFunc = (e) => {
    let btn = e.target;

    setFilter(btn.textContent);
    setNotifications(null); //first set to null, then reload by useEffect
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
      {notifications === null ? (
        <Loader />
      ) : (
        <div>
          {notifications.results.length ? (
            notifications.results.map((notification, i) => {
              return (
                <AnimationWrapper key={i} transition={{ delay: i * 0.08 }}>
                  <NotificationCard
                    data={notification}
                    index={i}
                    notificationState={{ notifications, setNotifications }}
                  />
                </AnimationWrapper>
              );
            })
          ) : (
            <NoStateMessage message={'Nothing available'} />
          )}

          <LoadMoreDataBtn
            state={notifications}
            fetchMoreData={fetchNotification}
            additionalParams={{
              deletedDocCount: notifications.deletedDocCount,
            }}
          />
        </div>
      )}
    </div>
  );
};
export default Notifications;
