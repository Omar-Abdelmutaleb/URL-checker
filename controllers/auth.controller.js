import User from "../models/user.model.js";
import UserVerification from "../models/userVerification.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import nodemailer from "nodemailer";
import { createError } from "../utils/createError.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
dotenv.config();

export const reg = async (req, res, next) => {
  let { username, email, password, dateOfBirth } = req.body;
  username = username.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth;

  if (username == "" || email == "" || password == "" || dateOfBirth == "") {
    res.json({
      status: "FAILED",
      message: "EMPTY INPUT FIELDS",
    });
  } else if (!/^[a-zA-Z]*$/.test(username)) {
    res.json({
      status: "FAILED",
      message: "INVALID USERNAME ENTERED",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "INVALID EMAIL ENTERED",
    });
  } else if (!new Date(dateOfBirth).getTime()) {
    res.json({
      status: "FAILED",
      message: "INVALID DATE OF BIRTH ENTERED",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "PASSWORD SHOULD BE MORE THAN 8 CHARACTERS",
    });
  } else {
    // TRY CREATE NEW USER
    //try {
    const user = await User.findOne({ email });
    if (user) {
      res.json({
        status: "FAILED",
        message: "USER ALREADY EXIST",
      });
    } else {
      // PASSWORD HANDLING
      // try {
      const hash = await bcrypt.hash(req.body.password, 5);
      const newUser = new User({
        ...req.body,
        password: hash,
      });
      console.log("OBAA1");

      const { password, ...otherInfo } = newUser._doc;
      await newUser.save().then((result) => {
        sendVerificationEmail(result, res);
      });
      // .catch(
      //   res.json({
      //     status: "FAILED",
      //     message: "ERROR OCCURED WHILE SAVING USER TO DATABASE",
      //   })
      // );

      //HANDLE EMAIL VERIFICATION
      console.log("OBAA2");
      // res.json({
      //   status: "SUCCESS",
      //   message: "ACCOUNT CREATED SUCCESSFULLY",
      // });
      // } catch (error) {
      //   res.json({
      //     status: "FAILED",
      //     message: "ERROR OCCURED WHILE HASHING THE PASSWORD",
      //   });
      // }
    }
    // } catch (error) {
    //   res.json({
    //     status: "FAILED",
    //     message: "ERROR OCCURED WHILE CHECKING FOR USER EXISTENCE",
    //   });
    // }
  }
};

export const verify = async (req, res) => {
  let { userId, uniqueString } = req.params;
  try {
    const userVerify = await UserVerification.findOne({ userId });
    // USER VERIFICATION EXISTS
    if (!userVerify) {
      let message =
        "ACCOUNT VERIFICATION DOESN'T EXIST OR HAS BEEN VERIFIED ALREADY, PLEASE SIGN UP OR LOGIN";
      res.redirect(`/api/auths/verified?error=true&message=${message}`);
    } else {
      // CHECKING FOR EXPIRATION OF UNIQUE STRING
      const { expiresAt } = userVerify;
      const hashedUniqueString = userVerify.uniqueString;

      if (expiresAt < Date.now()) {
        try {
          await UserVerification.deleteOne({ userId });
          await User.deleteOne({ _id: userId })
            .then(() => {
              let message = "LINK HAS EXPIRED, PLEASE SIGN UP AGAIN";
              res.redirect(`/api/auths/verified?error=true&message=${message}`);
            })
            .catch((err) => {
              let message = "CLEARING USER WITH EXPIRED UNIQUE STRING";
              res.redirect(`/api/auths/verified?error=true&message=${message}`);
            });
        } catch (error) {
          let message =
            "AN ERROR OCCURED WHILE DELETEING USER VERIFICATION FROM DATABASE";
          res.redirect(`/api/auths/verified?error=true&message=${message}`);
        }
      } else {
        // VALID RECORD EXIST
        try {
          const isCorrect = await bcrypt.compare(
            uniqueString,
            hashedUniqueString
          );
          if (isCorrect) {
            await User.updateOne({ _id: userId }, { verified: true })
              .then(() => {
                UserVerification.deleteOne({ userId })
                  .then(() => {
                    const currentFilePath = fileURLToPath(import.meta.url);
                    const verifyHtmlPath = path.join(
                      path.dirname(currentFilePath),
                      "./../views/verify.html"
                    );
                    res.sendFile(verifyHtmlPath);
                  })
                  .catch((err) => {
                    let message =
                      "AN ERROR OCCURED WHILE FINALIZING SUCCESSFUL VERIFICATION";
                    res.redirect(
                      `/api/auths/verify?error=true&message=${message}`
                    );
                  });
              })
              .catch((err) => {
                let message =
                  "AN ERROR OCCURED WHILE UPDATING USER RECORD TO SHOW VERIFIED";
                res.redirect(
                  `/api/auths/verified?error=true&message=${message}`
                );
              });
          } else {
            // RECORD EXITS BUT WRONG VERIFICATION DETAILS
            let message = "INVALID VERIFICATION DETAILS PASSED";
            res.redirect(`/api/auths/verified?error=true&message=${message}`);
          }
        } catch (error) {
          let message = "AN ERROR OCCURED WHILE COMPARING UNIQUE STRINGS";
          res.redirect(`/api/auths/verified?error=true&message=${message}`);
        }
      }
    }
  } catch (error) {
    console.log(error);
    let message =
      "AN ERROR OCCURED WHILE CHECKING FOR USER VERIFICATION EXISTENCE IN DATABASE";
    res.redirect(`/verified?error=true&message=${message}`);
  }
};

export const verified = async (req, res) => {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const verifyHtmlPath = path.join(
      path.dirname(currentFilePath),
      "./../views/verify.html"
    );
    res.sendFile(verifyHtmlPath);
  } catch (error) {
    console.log(error);
    res.json({
      status: "FAILED",
      message: "COULDN'T LOAD THE HTML FILE",
    });
  }
};

export const log = async (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "EMPTY CREDENTIALS APPLIED",
    });
  } else {
    // CHECK IF USER EXITS

    const user = await User.findOne({ email });

    // USER EXITS, SO VERIFY PASSWORD
    if (!user) {
      res.json({
        status: "FAILED",
        message: "USER WITH THIS EMAIL IS NOT FOUND",
      });

      if (!user.verified) {
        res.json({
          status: "FAILED",
          message: "YOUR EMAIL IS NOT VERIFIED YET, GO TO YOUT INBOX",
        });
      }
    } else {
      const isCorrect = await bcrypt.compare(req.body.password, user.password);
      if (isCorrect) {
        try {
          const token = jwt.sign({ id: user._id }, process.env.JWT_KEY);
          res.cookie("accessToken", token, { httpOnly: true });
        } catch (error) {
          res.json({
            status: "FAILED",
            message: "AN ERROR OCCURED WHILE CREATING TOKEN",
          });
        }

        res.json({
          status: "SUCCESS",
          message: "LOGIN SUCCESSFUL",
          data: user,
        });
      } else {
        res.json({
          status: "FAILED",
          message: "USERNAME OR PASSWORD IS NOT CORRECT",
        });
      }
    }
  }
};

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL, //process.env.AUTH_EMAIL,
    pass: process.env.AUTH_EMAIL_PASSWORD, //process.env.AUTH_EMAIL_PASSWORD,
  },
});

export const sendVerificationEmail = async (user, res) => {
  const currentURL = "http://localhost:3000/";
  const uniqueString = user._id.toString();
  const mailOptions = {
    from: "process.env.AUTH_EMAIL",
    to: user.email,
    subject: "Verify your Email",
    html: `<p>Verify your email to complete the registeration process successfully and start logging in whenever you want!</p>
      <p><b>This link expires in 3 hours.</b></p><p>Press <a href=${
        currentURL + "api/auths/verify/" + user._id + "/" + uniqueString
      }> here</a> to proceed. </p>
      `,
  };
  // HASH THE UNIQUE STRING
  const saltRounds = 10;
  const hash = await bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
      //SET VALUES IN USERVERIFICATION COLLECTION
      const newVerification = new UserVerification({
        userId: user._id,
        uniqueString: hashedUniqueString,
        expiresAt: Date.now() + 10800000, // epires in 3 hours in ms
      });
      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(
              res.json({
                status: "PENDING",
                message: "EMAIL VERIFICATION SENT SUCCESSFULLY",
              })
            )
            .catch((err) => {
              console.log(err + " 291");
              res.json({
                status: "FAILED",
                message: "VERIFICATION EMAIL FAILED",
              });
            });
        })
        .catch((err) => {
          console.log(err + " 299");
          res.json({
            status: "FAILED",
            message: "COULDN'T SAVE EMAIL VERIFICATION DATA",
          });
        });
    })
    .catch((err) => {
      console.log(err + " 307");
      res.json({
        status: "FAILED",
        message: "AN ERROR OCCURED WHILE HASHING EMAIL DATA",
      });
    });
};

export const register = async (req, res, next) => {
  try {
    // let transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.AUTH_EMAIL,
    //     pass: process.env.AUTH_EMAIL_PASSWORD,
    //   },
    // });

    const hash = await bcrypt.hash(req.body.password, 5);
    const newUser = new User({
      ...req.body,
      password: hash,
    });

    await newUser.save().then((result) => {
      sendVerificationEmail(result, res);
    });
    // const mailOptions = {
    //   from: "process.env.AUTH_EMAIL",
    //   to: newUser.email,
    //   subject: "Verify your Email",
    //   html: `<p>Verify your email to complete the registeration process successfully and start loggin in whenever you want!</p>
    //       <p><b>This link expires in 3 hours.</b></p><p>Press <a href=${
    //         "http:localhost:3000/api/auths/verify" + _id + 2222 + "/"
    //       }> here</a> to proceed. </p>
    //       `,
    // };

    // transporter.sendMail(mailOptions, (err, result) => {
    //   if (err) {
    //     console.log(err);
    //     res.json("Opps error occured");
    //   } else {
    //     res.json("thanks for e-mailing me");
    //   }
    // });
    //res.status(201).send("USER HAS BEEN CREATED");
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    console.log(user);
    if (!user) return next(createError(404, "User not found"));

    const isCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isCorrect)
      return next(createError(400, "PASSWORD OR USERNAME IS INCORRECT"));

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_KEY
    );

    const { password, ...otherInfo } = user._doc;
    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .send(otherInfo);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "Strict",
      secure: true,
    })
    .json({
      status: "SUCCESS",
      message: "LOGOUT SUCCESSFUL",
    });
};
