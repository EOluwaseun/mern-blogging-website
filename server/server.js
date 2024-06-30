import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import bycrpt from 'bcrypt';
import User from './Schema/User.js';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const server = express();
let PORT = 5000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  autoIndex: true,
});

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

      // console.log(user);
      // return res.json({ status: 'User document' });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message }); //if d error is internal error
    });
});

server.listen(PORT, () => {
  console.log('server started');
});
