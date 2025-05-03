'use strict'

const path = require('path')
const config = require(path.join(__dirname, '/../config'))

const Notification = function (mailAgent) {
  this.mailAgent = mailAgent
}

Notification.prototype._buildMessage = function (fields, options, data) {
  return `
  <html>
    <body>
    <p>
      ${fields.name} has <a href="${options.origin}#${fields.parent}">replied to a comment</a> you subscribed to${data.siteName ? ` on <strong>${data.siteName}</strong>` : ''}.<br>
      You can always <a href="%mailing_list_unsubscribe_url%">unsubscribe</a> if you don't want further notifications for this thread.
    </p>
    </body>
  </html>
  `
}

Notification.prototype.send = function (to, fields, options, data) {
  const subject = `New reply on "${options.title}"`;

  return new Promise((resolve, reject) => {
    this.mailAgent.messages().send({
      from: `Sayan Sivakumaran <${config.get('email.fromAddress')}>`,
      to,
      subject,
      html: this._buildMessage(fields, options, data)
    }, (err, res) => {
      if (err) {
        return reject(err)
      }

      return resolve(res)
    })
  })
}

module.exports = Notification
