const LoadMoreDataBtn = ({ state, fetchMoreData }) => {
  //current value and page number of the blogs loaded
  // this function that fetches more data

  if (state != null && state.totalDocs > state.results.length) {
    //state.totalDoc is the number of total blogs we have in our database
    //state.result.length is the length of the data left in the database
    return (
      <button
        onClick={() => fetchMoreData({ page: state.page + 1 })}
        className="text-dark-grey p-4 px-6 bg-grey/20 hover:bg-text-white rounded-md flex items-center gap-2"
      >
        Load More
      </button>
    );
  }
};
export default LoadMoreDataBtn;
