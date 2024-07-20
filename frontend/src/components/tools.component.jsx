import Embed from '@editorjs/embed';
import List from '@editorjs/list';
import Image from '@editorjs/image';
import Header from '@editorjs/header';
import Quote from '@editorjs/quote';
import Marker from '@editorjs/marker';
import InlineCode from '@editorjs/inline-code';
import toast from 'react-hot-toast';
import axios from 'axios';
// import ImageTool from '@editorjs/image';

// import { handleBannerUpload } from './blog-editor.component';

const handleBannerUpload = async (e) => {
  // const files = e.target.files;
  // console.log(e?.target?.file);
  // const formData = new FormData();

  // for (let i = 0; i < files.length; i++) {
  //   formData.append('images', files[i]);
  // }

  try {
    const { data } = await axios.post(
      import.meta.env.VITE_SERVER_DOMAIN + '/upload',
      // formData,
      {
        headers: { 'Content-type': 'multipart/form-data' },
      }
    );
    const img = data.map((i) => ({
      public_id: i.public_id,
      url: i.url,
    }));

    return img;
    // console.log(img);
  } catch (err) {
    alert(err);
  }
};

const handleUpload = async (e) => {
  const imageUrls = await handleBannerUpload(e);

  if (imageUrls && imageUrls.length > 0) {
    console.log(imageUrls);
  } else {
    console.log('no url');
  }
};

const uploadImageByURL = (e) => {
  let link = new Promise((resolve, reject) => {
    try {
      resolve(e);
    } catch (err) {
      reject(err);
    }
  });
  return link.then((url) => {
    return {
      success: 1,
      file: { url },
    };
  });
};

const uploadImageByFile = async (e) => {
  const url = await handleUpload(e);
  return {
    success: 1,
    file: { url },
  };
};

export const tools = {
  embed: Embed,
  list: {
    class: List,
    inlineToolbar: true,
  },
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByUrl: uploadImageByURL,
        uploadByFile: uploadImageByFile,
      },
    },
  },
  header: {
    class: Header,
    config: {
      placeholder: 'type Heading...',
      leve: [2, 3, 4],
      defaultLevel: 2,
    },
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
  },
  marker: Marker,
  InlineCode: InlineCode,
};
