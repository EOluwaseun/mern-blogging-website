import { createContext, useContext, useEffect, useState } from 'react';
import { UserContext } from '../App';
import { Navigate, useParams } from 'react-router-dom';
import BlogEditor from '../components/blog-editor.component';
import PublishForm from '../components/publish-form.component';
import Loader from '../components/loader.component';
import axios from 'axios';

const blogStructure = {
  title: '',
  banner: '',
  content: [],
  tags: [],
  des: '',
  author: { personal_info: {} },
};

export const EditorContext = createContext({});

const Editor = () => {
  // get blog id
  let { blog_id } = useParams();

  // creating blog state
  const [blogState, setBlogState] = useState(blogStructure);
  //this is used to render page conditionally
  const [editorState, setEditorState] = useState('editor');
  // isReady is a key from text editor
  const [textEditor, setTextEditor] = useState({ isReady: false });
  const [loading, setLoading] = useState(true);

  //useAuth is destructure from userContext, and also access_token is destructure from useAuth
  //instead of doing useAuth.access_token
  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  const getBlogEdit = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + '/get-blog', {
        blog_id,
        draft: true,
        mode: 'edit',
      })
      //edit mode won't increase the read count of d blog if i request it through edit mode,
      //draft:true => means i can get d draft data to edit aswell
      //once i get d data from backend i will then use DOT THEN
      .then(({ data: { blog } }) => {
        setBlogState(blog);
        setLoading(false);
      })
      .catch((err) => {
        // console.log(err);
        blogState(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!blog_id) {
      //this means im am on editor path not on specific blod editor   Id
      //if blog ID is not available, set loading to false
      return setLoading(false);
    }
    getBlogEdit();
  }, []);

  return (
    <EditorContext.Provider
      value={{
        blogState,
        setBlogState,
        editorState,
        setEditorState,
        textEditor,
        setTextEditor,
      }}
    >
      {access_token === null ? (
        <Navigate to={'/sign-in'} />
      ) : //check for loading if user is sign in
      loading ? (
        <Loader />
      ) : editorState === 'editor' ? (
        <BlogEditor />
      ) : (
        <PublishForm />
      )}
    </EditorContext.Provider>
  );
};

export default Editor;
