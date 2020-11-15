const express = require('express');
const i18n = require('i18n');
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const router = express.Router();

const validations = [
  check('firstName').trim().isLength({ min: 3 }).escape().withMessage('ValidFirstNameIsRequired'),
  check('lastName').trim().isLength({ min: 3 }).escape().withMessage('ValidLastNameIsRequired'),
  check('email').trim().isEmail().normalizeEmail().withMessage('PleaseEnterAValidEmailAddress'),
  check('jobTitle').trim().isLength({ min: 3 }).escape().withMessage('YourJobTitleIsRequired'),
  check('companyName')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('PleaseEnterYourCompanyName'),
  check('phoneNumber')
    .trim()
    .isLength({ min: 7 })
    .escape()
    .withMessage('PleaseEnterYourPhoneNumber'),
];

module.exports = () => {
  function sendMail(obj, request) {
    // const transporter = nodemailer.createTransport({
    //   host: 'smtp-mail.outlook.com', // hostname
    //   secureConnection: false, // TLS requires secureConnection to be false
    //   port: 587, // port for secure SMTP
    //   auth: {
    //     user: 'contact@pinpoints.me',
    //     pass: 'Pinpoint@123',
    //   },
    //   tls: {
    //     ciphers: 'SSLv3',
    //   },
    // });

    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      auth: {
        user: 'contact@pinpoints.me',
        pass: 'Pinpoint@123',
      },
      logger: true,
      debug: true, // include SMTP traffic in the logs
    });

    const mailOptions = {
      from: 'contact@pinpoints.me',
      to: obj.email,
      subject: 'Request A Demo',
      html:
        '<p> Name: ' +
        `${obj.firstName}` +
        ' ' +
        `${obj.lastName}` +
        '</p><p>Email: ' +
        `${obj.email}` +
        '</p><p>Job Title: ' +
        `${obj.jobTitle}` +
        '</p><p>Company Name: ' +
        `${obj.companyName}` +
        '</p><p>Phone Number: ' +
        `${obj.phoneNumber}` +
        '</p>',
    };

    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ');
      }
    });
    request.session.getDemo = {
      message: 'Thank you!',
      body: {},
    };
  }

  router.get('/', (request, response, next) => {
    try {
      if (request.query.lng) {
        i18n.setLocale(request.query.lng);
      }
      response.locals = i18n;
      return response.render('layout', {
        pageTitle: 'Business',
        template: 'business',
      });
    } catch (err) {
      return next(err);
    }
  });
  router.get('/get-demo', (request, response, next) => {
    try {
      if (request.query.lng) {
        i18n.setLocale(request.query.lng);
      }
      response.locals = i18n;
      const errors = request.session.getDemo ? request.session.getDemo.errors : false;

      const successMessage = request.session.getDemo ? request.session.getDemo.message : false;

      const body = request.session.getDemo ? request.session.getDemo.body : false;
      request.session.getDemo = {};
      return response.render('layout', {
        home: { title: request.locale },
        template: 'get-demo',
        errors,
        successMessage,
        body,
      });
    } catch (err) {
      return next(err);
    }
  });
  router.post('/get-demo', validations, (request, response, next) => {
    try {
      if (request.query.lng) {
        i18n.setLocale(request.query.lng);
      }
      response.locals = i18n;
      const errors = validationResult(request);
      const { firstName, lastName, email, jobTitle, companyName, phoneNumber } = request.body;

      if (!errors.isEmpty()) {
        request.session.getDemo = {
          errors: errors.array(),
          body: { firstName, lastName, email, jobTitle, companyName, phoneNumber },
        };
        response.writeHead(303, { Location: `${request.headers.referer}#get-demo-mobile` });
        return response.end();
      }
      sendMail({ firstName, lastName, email, jobTitle, companyName, phoneNumber }, request);
      return response.redirect('/business/get-demo');
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
