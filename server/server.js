import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import bycrpt from 'bcrypt';
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccountKey from './blog-yt-7f130-firebase-adminsdk-u6n9o-bf7ee70fef.json' assert { type: 'json' };

import {
  uploadPhoto,
  blogImgResize,
} from './middleware/imageUploadMiddleWare.js';

import { cloudinaryUpload } from './utils/cloudinary.js';
// import fs from 'fs';
// this is firebase server side function
import { getAuth } from 'firebase-admin/auth';

const server = express();
let PORT = 5000;

// connect admin to firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  autoIndex: true,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  //if authHeader exist, split it from the spacing and get it's first index
  const token = authHeader && authHeader.split(' ')[1];

  if (token === null) {
    return res.status(401).json({ error: 'No access token' });
  }
  jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Access token invalid' });
    }
    req.user = user.id;
    next();
  });
};

const formatDatatoSend = (user) => {
  // create access token, it takes two parameter 1 id of urser, 2 is private key to hash the password
  const access_token = jwt.sign(
    { id: user._id },
    process.env.SECRET_ACCESS_KEY
  );
  return {
    // the access token will be store in user session storage to validate user everytime they login
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};
const generateUsername = async (email) => {
  let username = email.split('@')[0];

  let isUserNameNotUnique = await User.exists({
    'personal_info.username': username,
  }).then((result) => result);

  isUserNameNotUnique ? (username += nanoid().substring(0, 3)) : '';
  return username;
};

server.post('/signup', (req, res) => {
  let { fullname, email, password } = req.body;
  if (fullname.length < 3) {
    return res
      .status(403)
      .json({ error: 'Fullname must not be less than 3 characters' });
  }
  if (!email.length) {
    return res.status(403).json({ error: 'Enter email' });
  }

  if (!emailRegex.test(email)) {
    return res.status(403).json({ error: 'invalid email' });
  }
  if (!passwordRegex.test(password)) {
    return res.status(403).json({
      error:
        'Password should be 6 or 20 character long with numeric, 1 lowercase and 1 uppercase letters',
    });
  }

  bycrpt.hash(password, 10, async (err, hashed_password) => {
    let username = await generateUsername(email);
    let user = new User({
      personal_info: { fullname, email, username, password: hashed_password },
    });
    user
      .save()
      .then((u) => {
        return res.status(200).json({ user: formatDatatoSend(u) });
      })
      .catch((err) => {
        if (err.code === 11000) {
          return res.status(500).json({ error: 'Email already exist' });
        }
        return res.status(500).json({ error: err.message });
      });
  });

  //   return res.status(200).json({ status: 'okay' });
});

server.post('/signin', (req, res) => {
  //destructure email and password from the body
  let { email, password } = req.body;

  // find if d email pass from the body in the User database
  User.findOne({ 'personal_info.email': email })
    .then((user) => {
      //
      if (!user) {
        return res.status(403).json({ error: 'email not found' });
      }

      //only ask for password if google auth is false
      if (!user.google_auth) {
        //compare password
        bycrpt.compare(password, user.personal_info.password, (err, result) => {
          if (err) {
            //if there is error while comparing the password
            return res
              .status(403)
              .json({ error: 'Error occur while login, please try again' });
          }
          //if password is incorrect
          if (!result) {
            return res.status(403).json({ error: 'Incorrect password' });
          } else {
            return res.status(200).json(formatDatatoSend(user));
          }
        });
      } else {
        return res.status(403).json({
          error: 'Account was created using google. Try log in with google',
        });
      }

      // console.log(user);
      // return res.json({ status: 'User document' });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message }); //if d error is internal error
    });
});

// google auth
server.post('/google-auth', async (req, res) => {
  let { access_token } = req.body;

  getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;

      picture = picture.replace(
        's96-c',
        's384                                                                                                                                                                                                                                                                                                                                                                                                                                                              -c'
      );

      let user = await User.findOne({ 'personal_info.email': email })
        .select(
          'personal_info.fullname personal_info.username personal_info.profile_img google_auth'
        )
        .then((u) => {
          return u || null;
        })
        .catch((err) => {
          return res.status(500).json({ error: err.message });
        });

      if (user) {
        if (!user.google_auth) {
          return res.status(403).json({
            Error:
              'This email was signed up without google. Please log in with password to access the account',
          });
        }
      } else {
        let username = await generateUsername(email);
        user = new User({
          personal_info: {
            fullname: name,
            email,
            //default image will be use cos of google image obstruction
            // profile_img: picture,
            username,
          },
          google_auth: true,
        });
        await user
          .save()
          .then((u) => {
            user = u;
          })
          .catch((err) => {
            return res.status(500).json({ error: err.message });
          });
      }
      return res.status(200).json(formatDatatoSend(user));
    })
    .catch((err) => {
      return res.status(500).json({
        error:
          'Failed to authenticate you with google, Try with some other google account',
      });
    });
});

server.post(
  '/upload',
  uploadPhoto.array('images', 10),
  blogImgResize,
  async (req, res) => {
    try {
      const uploader = (path) => cloudinaryUpload(path, 'images');
      const urls = [];
      const files = req.files;
      for (const file of files) {
        const { path } = file;
        const newpath = await uploader(path);
        // console.log(newpath);
        urls.push(newpath);
        // fs.unlinkSync(path);
      }
      const images = urls.map((file) => {
        return file;
      });
      res.json(images);
      // console.log(images);
    } catch (error) {
      throw new Error(error);
    }
  }
);

//send form to the backend
server.post('/create-blog', verifyJWT, (req, res) => {
  let authorId = req.user; // get user id
  let { title, des, banner, tags, content, draft } = req.body;
  if (!title.length) {
    return res
      .status(403)
      .json({ error: 'You must provide a title to publish a blog' });
  }
  //only if draft is false, publish otherwise don't ask of this conditions
  if (!draft) {
    if (!des.length || des.length > 200) {
      return res
        .status(403)
        .json({ error: 'You must description under 200 characters' });
    }
    if (!banner.length) {
      return res
        .status(403)
        .json({ error: 'You must provide banner to publish a blog' });
    }
    if (!content.blocks.length) {
      return res
        .status(403)
        .json({ error: 'There must be some blog content to publish it' });
    }
    if (!tags.length || tags.length > 10) {
      return res.status(403).json({
        error:
          'Provide tags in order to publish the blog, maximum of 10 tags is allowed',
      });
    }
  }

  //convert tags to lowercase
  tags = tags.map((tag) => tag.toLowerCase());
  let blog_id =
    title
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\s+/g, '-')
      .trim() + nanoid();

  let blog = new Blog({
    title,
    des,
    banner,
    content,
    tags,
    author: authorId,
    blog_id,
    draft: Boolean(draft),
  });

  blog
    .save()
    .then((blog) => {
      let increaseVal = draft ? 0 : 1;

      //$inc is used to increase value by 1,
      //$push allows to value into blogs field, and i'm pushing blog ID

      User.findOneAndUpdate(
        { _id: authorId },
        {
          //increase total posts by 1
          $inc: { 'account_info.total_posts': increaseVal },
          //push blog_id into blogs array from User model
          //blog actual _id not the generated _id
          $push: { blogs: blog._id },
        }
      )
        .then((user) => {
          //find d user info, and once it is resolve. you get the user data
          return res.status(200).json({ id: blog.blog_id });
          //send back back the generated _id
        })
        .catch((err) => {
          return res
            .status(500)
            .json({ error: 'Failed to update total post number' });
        });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.listen(PORT, () => {
  console.log('server connected');
});
