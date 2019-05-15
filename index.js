const request = require('request-promise').defaults({
  jar: true, // Enable cookie jar since it looks like csrf is saved here as well
  followAllRedirects: true
})
const cheerio = require('cheerio')
const sendEmail = require('./Email.js')
require('dotenv').config()

// firestore
const admin = require('firebase-admin')
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})
const db = admin.firestore()

const loginUrl = 'https://huurgoed.nl/login'

async function loginHuurgoed () {
  try {
    const html = await request.get(loginUrl) // get csrf token cookie and token from html form
    const $ = await cheerio.load(html)
    const token = $("input[name='_token']").val()
    const result = await request.post({
      // POST request with cookie set, and token from form
      uri: loginUrl,
      form: {
        _token: token,
        email: process.env.HUURGOED_USER,
        password: process.env.HUURGOED_PASS
      },
      headers: {
        referer: 'https://huurgoed.nl/login'
      },
      simple: false
    })
  } catch (error) {
    console.error('there was a problem ' + error)
  }
}

async function scrapeHuurgoed () {
  const url = 'https://huurgoed.nl/gehele-aanbod'
  const htmlResult = await request.get(url)
  const $ = await cheerio.load(htmlResult)
  $('div.item').each((index, element) => {
    const title = $(element)
      .find('.kenmerken > h2')
      .text()
      .trim()
    const characteristics = $(element)
      .find('h4')
      .text()
      .trim()
    const newHouse = {
      title: title,
      characteristics: characteristics
    }
    const houseRef = db.collection('huurgoed').doc(title)
    const getDoc = houseRef
      .get()
      .then(doc => {
        if (!doc.exists) {
          db.collection('huurgoed')
            .doc(title)
            .set(newHouse)
            .then(() => {
              console.log('New house added to database')
            })
          // inform the user that a new house is available.
          sendEmail(url, title, characteristics)
        } else {
          console.log('House exists!')
        }
      })
      .catch(err => {
        console.error('Error getting document', err)
        process.exit()
      })
    return getDoc
  })
}

async function main () {
  try {
    await loginHuurgoed()
    await scrapeHuurgoed()
  } catch (err) {
    console.error(err)
  }
}

main()
