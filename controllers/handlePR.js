'use strict'

const config = require('../config')
const GitHub = require('../lib/GitHub')
const Staticman = require('../lib/Staticman')

module.exports = async (repo, data) => {
  const ua = config.get('analytics.uaTrackingId')
    ? require('universal-analytics')(config.get('analytics.uaTrackingId'))
    : null

  if (!data.number) {
    return
  }

  const github = await new GitHub({
    username: data.repository.owner.login,
    repository: data.repository.name,
    version: '1'
  })

  try {
    let review = await github.getReview(data.number)
    if (review.sourceBranch.indexOf('staticman_')) {
      return null
    }

    if (review.state !== 'merged' && review.state !== 'closed') {
      return null
    }

    if (review.state === 'merged') {
        // Let's wait a bit before we send the email, as the deploy of the new website
        // will take a while. It would be confusing to receive an email about a new comment
        // when the comment has not shown up on the website yet.
        // 10 minutes to deploy should be enough for the foreseeable future.
        console.log("Received comment merge webhook event. Queueing mail send.")
        setTimeout(async() => {
              const bodyMatch = review.body.match(/(?:.*?)<!--staticman_notification:(.+?)-->(?:.*?)/i)
              if (bodyMatch && (bodyMatch.length === 2)) {
                try {
                  const parsedBody = JSON.parse(bodyMatch[1])
                  const staticman = await new Staticman(parsedBody.parameters)

                  staticman.setConfigPath(parsedBody.configPath)
                  staticman.processMerge(parsedBody.fields, parsedBody.options)
                } catch (err) {
                    console.err("Something went wrong processing merge.", err);
                }
              }
        }, 10 * 60 * 1000);
    }

    if (ua) {
      ua.event('Hooks', 'Delete branch').send()
    }
    return github.deleteBranch(review.sourceBranch)
  } catch (e) {
    console.log(e.stack || e)

    if (ua) {
      ua.event('Hooks', 'Delete branch error').send()
    }

    return Promise.reject(e)
  }
}
