module.exports = function (url, title, characteristics) {
  var nodemailer = require('nodemailer')

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER, // or 'user@example.com
      pass: process.env.NODEMAILER_PASS // or 'password1234'
    }
  })

  var mailOptions = {
    from: process.env.NODEMAILER_USER, // or 'user@example.com
    to: process.env.NODEMAILER_USER,
    subject: 'New house on ' + url + ' is available',
    text: 'Street: ' + title + ' and characteristics: ' + characteristics
  }

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}
