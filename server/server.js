import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import bycrpt, { compare } from 'bcrypt';
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import Comment from './Schema/Comment.js';
import Notification from './Schema/Notification.js';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin';
// import serviceAccountKey from './firebase_file.json' assert { type: 'json' };
// const serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT);
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

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
  credential: admin.credential.cert(serviceAccount),
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

//update password
server.post('/change-password', verifyJWT, (req, res) => {
  let { currentPassword, newPassword } = req.body;

  if (
    !passwordRegex.test(currentPassword) ||
    !passwordRegex.test(newPassword)
  ) {
    return res.status(403).json({
      error:
        'Password should be 6 or 20 character long with numeric, 1 lowercase and 1 uppercase letters',
    });
  }

  User.findOne({ _id: req.user })
    .then((user) => {
      //if user log in with google , you can't change password
      if (user.google_auth) {
        return res.status(403).json({
          error:
            "You can't change account's password because you logged in with google",
        });
      }

      // compare password
      bycrpt.compare(
        currentPassword,
        user.personal_info.password,
        (err, result) => {
          if (err) {
            return res.status(500).json({
              error:
                'Some error occurs while changing password, please try again later',
            });
          }
          //if the current password is wrong
          if (!result) {
            return res.status(403).json({
              error: 'Incorrect current password',
            });
          }

          //comapare d password and hash it, if current password is correct
          bycrpt.hash(newPassword, 10, (err, hashed_password) => {
            User.findOneAndUpdate(
              { _id: req.user },
              { 'personal_info.password': hashed_password }
            )
              .then((u) => {
                return res.status(200).json({
                  status: 'Password changed',
                });
              })
              .catch((err) => {
                return res.status(403).json({
                  error: err.message,
                });
              });
          });
        }
      );
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'User not found' });
    });
});

// get blog from the database

server.post('/latest-blogs', (req, res) => {
  //page is 1 by default
  let { page } = req.body;
  let maxLimit = 5;

  //find all blogs,excluding the ones that is draft
  Blog.find({ draft: false })
    //populate will get the author, NB: author is assign the User ID in the blog Model
    //then i can now select whatever field i want in the USER model through the user Id
    .populate(
      'author',
      'personal_info.profile_img personal_info.username personal_info.fullname -_id'
      //geting profile image, username, and fullname from the User Model, using the ID author
      // _id will make sure id is not selected
    )
    .sort({ publishedAt: -1 })
    //sort the blog using PublishAt basis
    //-1 means give me d recent one first
    .select('blog_id title des banner activity tags publishedAt -_id')
    //select allows me pull only the information i need from the Blog, instead of pulling everythin at a go
    .skip((page - 1) * maxLimit)
    /*page is 1 by default, so 1 - 1 = 0, multiply by maxlimit(5)... this will give my 5 documents first*/
    //this calculate d skip document
    .limit(maxLimit)
    //limit allows me to limit my result in order not to get all the data at once
    .then((blogs) => {
      return res.status(200).json({ blogs });
      //this returns all the blogs structure
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
  //after mongoose is done running all these, it then pass the result
});

//this is  where i making request
server.post('/all-latest-blog-count', (req, res) => {
  //countDocument in moogoose let u run count query in d mongodb
  //i used same basis, only count published blog
  Blog.countDocuments({ draft: false })
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
      //count from the data base count method is passed to the totalDocs
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.get('/trending-blogs', (req, res) => {
  // sorting blog by read count, like count
  Blog.find({ draft: false })
    .populate(
      'author',
      'personal_info.profile_img personal_info.username personal_info.fullname -_id'
      //geting profile image, username, and fullname from the User Model, using the ID author
      // _id will make sure id is not selected
    )
    .sort({
      'activity.total_reads': -1,
      'activity.total_likes': -1,
      publishedAt: -1,
    })
    //sort the data by activity of total read
    //-1 means to get d lagest value before going to the smallest value for total read
    //-1 means to get d lagest value before going to the smallest value for most liked
    //-1 means to get d latest blog
    //we sorted base on this criteria
    .select('blog_id title publishedAt _id')
    .limit(5)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

//search
server.post('/search-blogs', (req, res) => {
  // this means i want to filter d blog acording to the tag
  let { tag, query, page, author, limit, eliminate_blog } = req.body; //destructure page too
  //after getiing d tag from d body
  let findQuery;
  //tags array is from d database, tag is from the client. if d value is equal
  //also find d ones that's not draft

  if (tag) {
    //this means, if we have tag from d frontend, give me tag. otherwise dont find query
    findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    // blog_id:{$ne:eliminate_blog}}; it will remove d current blog if it equals to
  } else if (query) {
    // if is query we have from d frontend
    findQuery = { draft: false, title: new RegExp(query, 'i') }; //This let d user search using title
    //lets say i have 'HOW TO CODE IN JS' -> if you searcg CODE , it will still bring blog related to code
    //this allows searching easy
    //inMogoose you have use the key you want to use, here we use Title and also create a new regex pattern -> new RegExp(qeury, i)
    //the query means, the query you want to check, i means it incase sensitive
  } else if (author) {
    findQuery = { author, draft: false };
  }

  let maxLimit = limit ? limit : 2; // how many blogs i want

  Blog.find(findQuery) //use find to findquery
    .populate(
      'author',
      'personal_info.profile_img personal_info.username personal_info.fullname -_id'
    )
    .sort({ publishedAt: -1 })
    .select('blog_id title des banner activity tags publishedAt -_id')
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post('/search-blogs-count', (req, res) => {
  let { tag, query, author } = req.body; //destruture d tag from the body

  let findQuery;

  if (tag) {
    //this means, if we have tag from d frontend, give me tag. otherwise dont find query
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    // if is query we have from d frontend
    findQuery = { draft: false, title: new RegExp(query, 'i') }; //This let d user search using title
    //lets say i have 'HOW TO CODE IN JS' -> if you searcg CODE , it will still bring blog related to code
    //this allows searching easy
    //inMogoose you have use the key you want to use, here we use Title and also create a new regex pattern -> new RegExp(qeury, i)
    //the query means, the query you want to check, i means it incase sensitive
  } else if (author) {
    findQuery = { author, draft: false };
  }

  Blog.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
      //count from the data base count method is passed to the totalDocs
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

// search user
server.post('/search-users', (req, res) => {
  let { query } = req.body;

  User.find({ 'personal_info.username': new RegExp(query, 'i') }) //seacrh for query in User
    .limit(50)
    .select(
      'personal_info.profile_img personal_info.username personal_info.fullname -_id'
    ) //select keys u want in d document
    .then((users) => {
      return res.status(200).json({ users });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

// get profile
server.post('/get-profile', (req, res) => {
  let { username } = req.body;
  //username is unique, so it will only find one and stop execution
  User.findOne({ 'personal_info.username': username }) //findOne find a unique data in document and stop execution
    .select('-personal_info.password -google_auth -updatedAt -blogs')
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

// update image
server.post('/update-profile-img', verifyJWT, (req, res) => {
  let { imageUrl } = req.body;

  User.findOneAndUpdate(
    { _id: req.user },
    { 'personal_info.profile_img': imageUrl }
  )
    .then(() => {
      return res.status(200).json({ profile_img: imageUrl });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

//update profile
server.post('/update-profile', verifyJWT, (req, res) => {
  let { username, bio, social_links } = req.body;

  let bioLimit = 150;

  if (username.length < 3) {
    return res
      .status(403)
      .json({ error: 'username should be at least 3 letters long' });
  }

  if (bio.length > bioLimit) {
    return res
      .status(403)
      .json({ error: `Bio should not be more than ${bioLimit} characters` });
  }

  //this gives array of social links
  let socialLinkArr = Object.keys(social_links);

  try {
    for (let i = 0; i < socialLinkArr.length; i++) {
      if (social_links[socialLinkArr[i]].length) {
        let hostname = new URL(social_links[socialLinkArr[i]]).hostname;

        if (
          !hostname.includes(`${socialLinkArr[i]}.com`) &&
          socialLinkArr[i] != 'website'
        ) {
          return res.status(403).json({
            error: `${socialLinkArr[i]} link is invalid. You must enter a full link`,
          });
        }
      }
    }
  } catch (err) {
    return res.status(500).json({
      error: 'You must provide full social links with http(s) included',
    });
  }

  let updateObj = {
    'personal_info.username': username,
    'personal_info.bio': bio,
    social_links,
  };
  User.findOneAndUpdate({ _id: req.user }, updateObj, {
    runValidators: true,
  })
    .then(() => {
      return res.status(200).json({ username });
    })
    .catch((err) => {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'username already exist' });
      }
      //if it's not duplication error
      return res.status(500).json({ error: err.message });
    });
});

//send form to the backend
server.post('/create-blog', verifyJWT, (req, res) => {
  let authorId = req.user; // get user id
  let { title, des, banner, tags, content, draft, id } = req.body;
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
    id ||
    title
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\s+/g, '-')
      .trim() + nanoid();

  if (id) {
    Blog.findOneAndUpdate(
      { blog_id },
      { title, des, banner, tags, content, draft: draft ? draft : false }
    )
      .then(() => {
        return res.status(200).json({ id: blog_id });
      })
      .catch((err) => {
        // return res.status(500).json({ error: err.message });
        return res.status(500).json({ error: err.message });
      });
  } else {
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
  }
});

//get a single blog
server.post('/get-blog', (req, res) => {
  let { blog_id, draft, mode } = req.body; //destructuring blog_id from d frontend

  let increamentVal = mode != 'edit' ? 1 : 0;
  // if(mode != '')

  Blog.findOneAndUpdate(
    { blog_id },
    { $inc: { 'activity.total_reads': increamentVal } }
  )
    //using findAndUpdate instead of findOne, it's bcos i want to update d likes, comment on the blog
    //$inc this is increament sign in mongoose
    //it's saying increament d total number of reads pataining to Pthis blog by 1
    .populate(
      'author',
      'personal_info.fullname personal_info.username personal_info.profile_img'
    )
    //populate get d author, and get the username and other information of the author
    .select('title des content banner activity publishedAt blog_id tags')
    //select title, des and so on of d blog
    .then((blog) => {
      //after getting d blog i want to update d reads  from d USER MODEL, thats d reason for populate
      User.findOneAndUpdate(
        { 'personal_info.username': blog.author.personal_info.username }, //10 people have read the blog i posted
        { $inc: { 'account_info.total_reads': increamentVal } }
      ).catch((err) => {
        return res.status(500).json({ error: err.message });
      });
      // .then((user) => {
      //   return res.status(200).json(user);
      // })
      // .catch((err) => {
      //   return res
      //     .status(500)
      //     .json({ error: 'Failed to update total post number' });
      // });

      // console.log(blog.author.personal_info.username);

      // .catch((err) => {
      //   //catch is used incase i get an error while getting this information from USER MODEL
      //   //so it wont stop my server
      //   return res.status(500).json({ error: err.message });
      // })
      //BLOG is the result from d blogs
      //AUTHOR is part of the result from BLOG
      //AUTHOR is referencing to USER in the USERMODEL
      // personal_info.username is coming from reference made to USERMODEL in d BLOGMODEL
      // Note:this blog is used to penetrate to the author

      if (blog.draft && !draft) {
        //check if d blog is draft
        //and if check if d blog is draft or not
        return res
          .status(500)
          .json({ error: 'you can not access draft blogs' });
      }

      return res.status(200).json({ blog });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

// like by user

server.post('/like-blog', verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id, isLikedByUser } = req.body;

  let increamentVal = !isLikedByUser ? 1 : -1;

  Blog.findOneAndUpdate(
    { _id },
    { $inc: { 'activity.total_likes': increamentVal } }
  ).then((blog) => {
    if (!isLikedByUser) {
      let like = new Notification({
        type: 'like',
        blog: _id,
        notification_for: blog.author,
        user: user_id,
      });

      like.save().then((notification) => {
        return res.status(200).json({ liked_by_user: true });
      });
    } else {
      //delete notification if blog is unliked by d user
      Notification.findOneAndDelete({ user: user_id, type: 'like', blog: _id })
        .then((data) => {
          return res.status(200).json({ liked_by_user: false });
        })
        .catch((err) => {
          return res.status(500).json({ error: err.message });
        });
    }
  });
});

server.post('/isliked-by-user', verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id } = req.body; // get d blog ID

  Notification.exists({ user: user_id, type: 'like', blog: _id })
    .then((result) => {
      return res.status(200).json({ result });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
  //check is there is notification for d liked blog in d document
});

server.post('/add-comment', verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id, comment, blog_author, replying_to, notification_id } = req.body;
  /*
  replying_to is destructure to know the ID of the comment
  */

  if (!comment.length) {
    return res
      .status(403)
      .json({ error: 'Write something to leave a comment...' });
  }

  //create comment
  let commentObj = {
    blog_id: _id,
    blog_author, //owner of the blog
    comment,
    commented_by: user_id, //this whole d key of d user who commented
    // isReply
  };

  if (replying_to) {
    /*
    if i have ID, i will have parent
    */
    commentObj.parent = replying_to;
    commentObj.isReply = true; //this will make sure the reply is not render as the parent comment
  }

  new Comment(commentObj).save().then(async (commentFile) => {
    // commentfile referencing to d data saved in d database
    //these four are extracted from the comment file saving d neccesary
    let { comment, commentedAt, children } = commentFile;

    Blog.findOneAndUpdate(
      { _id },
      {
        //push d comment id into d comments Array
        $push: { comments: commentFile._id },
        $inc: {
          'activity.total_comments': 1,
          'activity.total_parent_comments': replying_to ? 0 : 1,
        },
      }
    ).then((blog) => {
      console.log('New comment created');
    });

    let notificationObj = {
      type: replying_to ? 'reply' : 'comment',
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: commentFile._id,
    };

    if (replying_to) {
      notificationObj.replied_on_comment = replying_to; // the comment i'm replying to

      await Comment.findOneAndUpdate(
        { _id: replying_to },
        { $push: { children: commentFile._id } }
        //children array contains all of the reply
        //comentFile._id is gtting added to the children cos it's a reply
      ).then((replyingToCommentDoc) => {
        notificationObj.notification_for = replyingToCommentDoc.commented_by;
      });

      if (notification_id) {
        //notification for reply
        Notification.findOneAndUpdate(
          { _id: notification_id },
          { reply: commentFile._id }
        ).then((notification) => {
          console.log('notification updated');
        });
      }
      /*
      _id of the comment document will equal to d comment ID
      */
    }

    new Notification(notificationObj).save().then((notification) => {
      console.log('new notification created');
    });

    return res.status(200).json({
      comment,
      commentedAt,
      _id: commentFile._id,
      user_id,
      children,
    });
  });
});

server.post('/get-blog-comments', (req, res) => {
  let { blog_id, skip } = req.body;

  let maxLimit = 5;

  //only get if reply is false, meaning it is a parent comment not reply
  Comment.find({ blog_id, isReply: false }) //it shudn't be a reply but a parent comment
    .populate(
      'commented_by',
      'personal_info.username personal_info.fullname personal_info.profile_img'
    )
    .skip(skip)
    .limit(maxLimit)
    .sort({
      commentedAt: -1,
    })
    .then((comment) => {
      // console.log(comment, blog_id, skip);
      return res.status(200).json(comment);
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post('/get-replies', (req, res) => {
  let { _id, skip } = req.body;

  let maxLimit = 5;

  // get the parent commet i want to get d replies
  Comment.findOne({ _id }) //this will find replies for this comment ID
    //find d comment and populate d children array
    .populate({
      path: 'children',
      options: {
        limit: maxLimit,
        skip: skip,
        sort: { commentedAt: -1 },
      },
      populate: {
        //this is populating all d data of the children array
        path: 'commented_by',
        select:
          'personal_info.profile_img personal_info.fullname personal_info.username',
      },
      select: '-blog_id -updatedAt',
    })
    .select('children')
    .then((doc) => {
      return res.status(200).json({ replies: doc.children });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

const deleteComments = (_id) => {
  Comment.findOneAndDelete({ _id })
    .then((comment) => {
      // delete d comment
      // check if the comment has a parent key
      //this means it's a reply if it has a parent
      if (comment.parent) {
        //find d comment parent and pull it's children
        Comment.findOneAndUpdate(
          { _id: comment.parent },
          { $pull: { children: _id } }
        ).then((data) => console.log('comment deleted from parent'));
      }

      //DELETE THE COMMENT FROM NOTIFICATION TOO
      Notification.findOneAndDelete({ comment: _id }).then((notification) =>
        console.log('comment notification deleted')
      );

      //DELETE THE REPLY FROM NOTIFICATION TOO
      Notification.findOneAndUpdate(
        { reply: _id },
        { $unset: { reply: 1 } }
      ).then((notification) => console.log('comment notification deleted'));

      //DELETE THE COMMENT FROM THE BLOG
      Blog.findOneAndUpdate(
        { _id: comment.blog_id }, //this refernce to the parent comment
        {
          $pull: { comments: _id },
          $inc: { 'activity.total_comments': -1 }, //remove 1
          'activity.total_parent_comments': comment.parent ? 0 : -1,
          //if i'm removing d parent Comment, there is no point in removing 1 from total_parent_comment cos it won't count again
        }
        //comment.parent ? 0 : -1   if the comment has a parent meaning it is reply i won't remove anythin from d parent comment
        // if it is a Comment, i will remove 1 from the total_parent_comment
      ).then((blog) => {
        if (comment.children.length) {
          //this comment is making reference to d comment i am deleting
          //if comment has some replies
          comment.children.map((replies) => {
            deleteComments(replies);
          }); //loop those replies and called the function again
          //if there is no reply, this function wont call itself
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

server.post('/delete-comment', verifyJWT, (req, res) => {
  let user_id = req.user; //get user who's deleting

  let { _id } = req.body;

  Comment.findOne({ _id }).then((comment) => {
    //find d comment i want to delete
    // console.log(comment.commented_by);
    // console.log(user_id);
    if (user_id == comment.commented_by || user_id == comment.blog_author) {
      //run this function if user log in user or d commented user
      deleteComments(_id); //this check all loops and nested loops

      return res.status(200).json({ status: 'done' });
    } else {
      return res.status(403).json({ error: 'You can not delete this comment' });
    }
  });
});

server.get('/new-notification', verifyJWT, (req, res) => {
  let user_id = req.user;

  Notification.exists({
    notification_for: user_id,
    seen: false,
    user: { $ne: user_id }, //don't include user
  })
    .then((result) => {
      if (result) {
        return res.status(200).json({ new_notification_available: true });
      } else {
        return res.status(200).json({ new_notification_available: false });
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post('/notifications', verifyJWT, (req, res) => {
  let user_id = req.user; // middleware verifyJWT is setting req.id to longin user_id

  let { page, filter, deletedDocCount } = req.body;

  let maxLimit = 10;

  let findQuery = { notification_for: user_id, user: { $ne: user_id } };

  let skipDocs = (page - 1) * maxLimit;

  if (filter != 'all') {
    //filter is coming from the frontend
    findQuery.type = filter; // type is in the notification
  }

  if (deletedDocCount) {
    skipDocs -= deletedDocCount;
    //if any notification is deleted, subtract so as not to mess with d documents
  }

  Notification.find(findQuery)
    .skip(skipDocs)
    .limit(maxLimit)
    .populate('blog', 'title blog_id') //populate blog key
    .populate(
      //populate user key
      'user',
      'personal_info.fullname personal_info.username personal_info.profile_img'
    )
    .populate('comment', 'comment')
    .populate('replied_on_comment', 'comment')
    .populate('reply', 'comment')
    .sort({ createdAt: -1 })
    .select('createdAt type seen reply')
    .then((notifications) => {
      Notification.updateMany(findQuery, { seen: true })
        .skip(skipDocs)
        .limit(maxLimit)
        .then(() => {
          console.log('notification seen');
        });

      return res.status(200).json({ notifications });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post('/all-notifications-count', verifyJWT, (req, res) => {
  //what is middleware
  let user_id = req.user;

  let { filter } = req.body;

  let findQuery = { notification_for: user_id, user: { $ne: user_id } };

  if (filter != 'all') {
    findQuery.type = filter;
  }

  Notification.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post('/user-written-blogs', verifyJWT, (req, res) => {
  let user_id = req.user;

  let { page, draft, query, deletedDocCount } = req.body;

  let maxLimit = 2;
  let skipDocs = (page - 1) * maxLimit;

  if (deletedDocCount) {
    skipDocs -= deletedDocCount;
  }

  Blog.find({ author: user_id, draft, title: new RegExp(query, 'i') })
    .skip(skipDocs)
    .limit(maxLimit)
    .sort({ publishedAt: -1 })
    .select('title banner publishedAt blog_id activity des draft -_id')
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post('/user-written-blogs-count', verifyJWT, (req, res) => {
  let user_id = req.user;

  let { draft, query } = req.body;

  Blog.countDocuments({ author: user_id, draft, title: new RegExp(query, 'i') })
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

server.post('/delete-blog', verifyJWT, (req, res) => {
  let user_id = req.user;
  let { blog_id } = req.body;

  Blog.findOneAndDelete({ blog_id })
    .then((blog) => {
      Notification.deleteMany({ blog: blog._id }).then((data) =>
        console.log('notifications deleted')
      );
      Comment.deleteMany({ blog: blog._id }).then((data) =>
        console.log('comment deleted')
      );

      User.findOneAndUpdate(
        { _id: user_id },
        { $pull: { blog: blog._id }, $inc: { 'account_info.total_posts': -1 } }
      ).then((user) => console.log('Blog deleted'));

      return res.status(200).json({ status: 'done' });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.listen(PORT, () => {
  console.log('server connected');
});
