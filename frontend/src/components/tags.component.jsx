import { useContext } from 'react';
import { EditorContext } from '../pages/editor.pages';

const Tags = ({ tag, tagIndex }) => {
  let {
    blogState,
    blogState: { tags },
    setBlogState,
  } = useContext(EditorContext);

  const addEditable = (e) => {
    //editable is added to d tags, but only onclick
    e.target.setAttribute('contentEditable', true);
    e.target.focus();
  };

  const handleTagEdit = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();

      //innertext is used cos it is paragraph tags
      let currentTag = e.target.innerText;
      tags[tagIndex] = currentTag;
      setBlogState({ ...blogState, tags });
      //this removes d cursor
      e.target.setAttribute('contentEditable', false);
    }
  };

  const handleTagDelete = () => {
    tags = tags.filter((t) => t !== tag);
    setBlogState({ ...blogState, tags });
  };
  return (
    <div className="relative p-2 mt-2 mr-2 px-5 bg-white rounded-lg inline-block hover:bg-opacity-50 pr-10">
      <p
        className="outline-none"
        // contentEditable="true"
        onClick={addEditable}
        onKeyDown={handleTagEdit}
      >
        {tag}
      </p>
      <button
        className="mt-[2px] rounded-full absolute right-2 top-1/2 -translate-y-1/2"
        onClick={handleTagDelete}
      >
        <i className="fi fi-br-cross text-sm pointer-events-none" />
      </button>
    </div>
  );
};
export default Tags;
