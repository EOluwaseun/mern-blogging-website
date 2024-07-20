import { createContext, useContext, useState } from 'react';
import { UserContext } from '../App';
import { Navigate } from 'react-router-dom';
import BlogEditor from '../components/blog-editor.component';
import PublishForm from '../components/publish-form.component';

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
  // creating blog state
  const [blogState, setBlogState] = useState(blogStructure);
  //this is used to render page conditionally
  const [editorState, setEditorState] = useState('editor');
  // isReady is a key from text editor
  const [textEditor, setTextEditor] = useState({ isReady: false });

  //useAuth is destructure from userContext, and also access_token is destructure from useAuth
  //instead of doing useAuth.access_token
  let {
    userAuth: { access_token },
  } = useContext(UserContext);

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
      ) : editorState === 'editor' ? (
        <BlogEditor />
      ) : (
        <PublishForm />
      )}
    </EditorContext.Provider>
  );
};

export default Editor;
