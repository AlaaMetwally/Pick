const express = require('express');
const i18n = require('i18n');

const router = express.Router();
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { exec } = require('child_process');
const businessRoute = require('./business');

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

module.exports = (params) => {
  router.get('/', (request, response, next) => {
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
        template: 'index',
        pageTitle: 'PinPoint',
        errors,
        successMessage,
        body,
      });
    } catch (err) {
      return next(err);
    }
  });
  router.post('/excel', (request, response, next) => {
    try {
      // Create a new instance of a Workbook class
      // Require library

      // Create a new instance of a Workbook class
      fs.readFile('pre-launch.xls', function (err, data) {
        if (err) throw err;
        if (data.indexOf(request.body.data) >= 0) {
          console.log(request.body.data);
        } else {
          fs.appendFile('pre-launch.xls', `${request.body.data} \n`, (err1) => {
            if (err1) throw err1;
            exec('echo test');
            exec('sudo rclone copy pre-launch.xls pinpoint:CTA', (error, stdout, stderr) => {
              if (error) {
                console.log(`error: ${error.message}`);
                return;
              }
              if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
              }
              console.log(`stdout: ${stdout}`);
            });
          });
        }
      });

      return response.json([
        {
          success_msg: 'You have been successfully signed up',
        },
      ]);
    } catch (err) {
      return next(err);
    }
  });
  router.get('/places', (request, response, next) => {
    try {
      return response.json([
        {
          place_name: 'Zara',
          address:
            'Unit GF - 118 The Dubai Mall, DownTown - Financial Center Rd - Dubai - United Arab Emirates',
          phone: '+97143308567',
          place: 'https://goo.gl/maps/LiCo1rxF9C5YRo4y7',
        },
        {
          place_name: 'Starbucks',
          address: 'Al Ghurair Centre - Dubai - United Arab Emirates',
          phone: '+97144190065',
          place: 'https://goo.gl/maps/EcLRy1b2vrZPD7gR8',
        },
        {
          place_name: 'Spinneys City Walk',
          address: '1 Al Safa St - Dubai - United Arab Emirates',
          phone: '+97143445207',
          place: 'https://goo.gl/maps/2H1VgPPhVNfeZ9bp6',
        },
        {
          place_name: 'Carrefour City Center Mirdif',
          address: 'Mirdif City Center - Dubai - United Arab Emirates',
          phone: '+97180073232',
          place: 'https://goo.gl/maps/WqkkueNi3bkhQ5VJ7',
        },
      ]);
    } catch (err) {
      return next(err);
    }
  });
  function sendMail(obj, request) {
    const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com', // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'pinpoints', // generated ethereal user
        pass: 'Pinpont@20201', // generated ethereal password
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });

    const mailOptions = {
      from: obj.email,
      to: 'contact@pinpoints.me',
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

        return response.redirect('/business/get-demo');
      }
      sendMail({ firstName, lastName, email, jobTitle, companyName, phoneNumber }, request);
      return response.redirect('/business/get-demo');
    } catch (err) {
      return next(err);
    }
  });
  router.use('/business', businessRoute(params));
  return router;
};
