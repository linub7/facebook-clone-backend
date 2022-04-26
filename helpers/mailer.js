const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const { OAuth2 } = google.auth;
const oauthLink = 'https://developers.google.com/oauthplayground';

const {
  EMAIL,
  FACEBOOK_CLONE_AUTHENTICATION_ID,
  FACEBOOK_CLONE_AUTHENTICATION_SECRET,
  FACEBOOK_CLONE_AUTHENTICATION_REFRESH,
} = process.env;

const auth = new OAuth2(
  FACEBOOK_CLONE_AUTHENTICATION_ID,
  FACEBOOK_CLONE_AUTHENTICATION_SECRET,
  FACEBOOK_CLONE_AUTHENTICATION_REFRESH,
  oauthLink
);

exports.sendVerificationEmail = (email, name, url) => {
  auth.setCredentials({
    refresh_token: FACEBOOK_CLONE_AUTHENTICATION_REFRESH,
  });

  const accessToken = auth.getAccessToken();
  const stmp = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: EMAIL,
      clientId: FACEBOOK_CLONE_AUTHENTICATION_ID,
      clientSecret: FACEBOOK_CLONE_AUTHENTICATION_SECRET,
      refreshToken: FACEBOOK_CLONE_AUTHENTICATION_REFRESH,
      accessToken,
    },
  });

  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: 'Facebook clone email verification',
    html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img style="width:30px" src="https://res.cloudinary.com/dmhcnhtng/image/upload/v1645134414/logo_cs1si5.png" alt="facebook"><span>Action require: Activate your facebook account</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">You recently created an account on Facebook. To complete your registration, please confirm your account</span></div><a style="width:200px;padding:10px 15px;background:#4c649b;color:#fff;text-decoration:none;font-weight:600" href=${url}>Confirm your account</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">Facebook allows you to stay in touch with all your friends, once registered on facebook, you can share photos, organize events and much more.</span></div></div>`,
  };

  stmp.sendMail(mailOptions, (err, res) => {
    if (err) return err;
    return res;
  });
};

exports.sendResetCode = (email, name, code) => {
  auth.setCredentials({
    refresh_token: FACEBOOK_CLONE_AUTHENTICATION_REFRESH,
  });

  const accessToken = auth.getAccessToken();
  const stmp = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: EMAIL,
      clientId: FACEBOOK_CLONE_AUTHENTICATION_ID,
      clientSecret: FACEBOOK_CLONE_AUTHENTICATION_SECRET,
      refreshToken: FACEBOOK_CLONE_AUTHENTICATION_REFRESH,
      accessToken,
    },
  });

  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: 'Reset Facebook Password',
    html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img style="width:30px" src="https://res.cloudinary.com/dmhcnhtng/image/upload/v1645134414/logo_cs1si5.png" alt="facebook"><span>Action require: Reset Password Code</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">Your reset password code.</span></div><a style="width:200px;padding:10px 15px;background:#4c649b;color:#fff;text-decoration:none;font-weight:600">${code}</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">Facebook allows you to stay in touch with all your friends, once registered on facebook, you can share photos, organize events and much more.</span></div></div>`,
  };

  stmp.sendMail(mailOptions, (err, res) => {
    if (err) return err;
    return res;
  });
};
