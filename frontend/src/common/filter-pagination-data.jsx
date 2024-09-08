import axios from 'axios';

export const filterPaginationData = async ({
  create_new_arr = false,
  state,
  data,
  page,
  countRoute,
  data_to_send = {},
  user = undefined,
  //data to send is object by default otherwise it be undefine
}) => {
  /*
    create_new_arr parameter =  is false by default
    this means if there is already an array, buh if i dont have array it means i dont have d data.
    this is also known as Previous or initial data
    */
  /*arr parameter = is the array we already have in the database*/
  /*data parameter = is the data i want to attached to the array*/
  /*page parameter = this will have the number of the current page*/
  /*countRoute parameter = i will specify countRoute whenever i called this pagination
  so that d countRoute make request to the route in the server and get d total document length*/
  /*data_to_send parameter = you need to send data to the countRoute, in other to count the specific document*/

  let obj;

  let headers = {};

  if (user) {
    headers.headers = { Authorization: `Bearer ${user}` };
  }
  //it means if the array [] i already have is not null, I.E it has data in it  state != null &&
  //i already have an array and i dont want to make a new array                 !create_new_arr
  //exclamation convert it true
  if (state != null && !create_new_arr) {
    //previous state
    /*
    1 we first covert our data structure to object
    2 destructure the previous state
    3 change the key of the state to an array []
    4 destructure state.result too
    5 destrcuture the new data, I.E data i want to attached to the array
    6 Add page key

    */
    obj = { ...state, results: [...state.results, ...data], page: page };
  } else {
    /*if i dont have anything in the array at all i, i have to create it
    i will first make a request to database
    */
    await axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + countRoute,
        data_to_send,
        headers
      )
      .then(({ data: { totalDocs } }) => {
        obj = { results: data, page: 1, totalDocs };
        /*
        1 get the data from the backend
        2 pass the page which is 1 by default
        3 totalDocs is recieved from the data sent by the route
        */
      })
      .catch((err) => {
        console.log(err);
      });
    /*i am making request to the counroute in other to get the total of the document in our database*/
    // since i am making a request, i have to send data too. so i will destructure the data to send to the backend
  }
  return obj;
};
