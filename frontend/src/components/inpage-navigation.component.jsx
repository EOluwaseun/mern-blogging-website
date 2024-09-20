import { useEffect, useRef, useState } from 'react';

//this will be used to move the hr in other page
export let activeTabLineRef;
export let activeTabRef;

const InpageNavigation = ({
  routes,
  defaultActiveTabIndex = 0,
  defaultHidden = [],
  children,
}) => {
  //  tabline to move around d lines
  activeTabLineRef = useRef();
  activeTabRef = useRef();

  //first page must b active
  let [inPageNavIndex, setInPageNavIndex] = useState(defaultActiveTabIndex);

  let [isResizeEventAdded, setIsResizeAdded] = useState(false);
  let [width, setWidth] = useState(window.innerWidth);

  const changePageState = (btn, i) => {
    //destructure d actual width of the button, every HTML element has this offsetwidth
    //offset left will give me d left value of the button, value from the left
    let { offsetWidth, offsetLeft } = btn;

    //referencing the tabline as current and change d width property
    // adding PX is important, otherwise it will just be number
    activeTabLineRef.current.style.width = offsetWidth + 'px'; //width of the btn
    activeTabLineRef.current.style.left = offsetLeft + 'px'; //left value of the btn

    // set the index in other to move the text color
    setInPageNavIndex(i);
  };

  useEffect(() => {
    if (width > 768 && inPageNavIndex != defaultActiveTabIndex) {
      //this effect will only run once, only when the page load
      changePageState(activeTabRef.current, defaultActiveTabIndex); //d state will be on first index even without clicking it
    }

    if (!isResizeEventAdded) {
      window.addEventListener('resize', () => {
        if (!isResizeEventAdded) {
          setIsResizeAdded(true);
        }

        setWidth(window.innerWidth);
      });
    }
  }, [width]);
  // console.log(width);
  return (
    <>
      <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto">
        {/* map through routes since it is an array */}
        {routes.map((route, i) => {
          return (
            <button
              ref={i === defaultActiveTabIndex ? activeTabRef : null}
              key={i}
              className={`p-4 px-5 capitalize ${
                inPageNavIndex === i ? 'text-black' : 'text-dark-grey'
              } ${defaultHidden.includes(route) ? 'md:hidden' : ''}`}
              //e.target is the button being clicked
              onClick={(e) => {
                changePageState(e.target, i);
              }}
            >
              {route}
            </button>
          );
        })}
        <hr
          ref={activeTabLineRef}
          className="absolute bottom-0 duration-300 border-dark-grey"
        />
      </div>
      {/*array.isArray check wether element is an array, then it returns true 
      ofcourse, the children here is an array, which means it has more than 1
      render only that children with the same index as the navIndex ontherwise
      render d children only*/}
      {Array.isArray(children) ? children[inPageNavIndex] : children}
    </>
  );
};

export default InpageNavigation;
