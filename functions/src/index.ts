/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions'
import { onRequest } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import { createHash as cryptoCreateHash } from 'crypto'

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 })

export const helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true })
  response.send('Bienvenido a SA&JU!')
})

export const getServerTimestamp = onRequest((request, response) => {
  logger.info('getServerTimestamp function triggered')
  const now = new Date()
  response.json({
    iso: now.toISOString(),
    timestamp: now.getTime(),
  })
})

const createHashFunc = (text: string) => {
  return cryptoCreateHash('sha256').update(text).digest('hex')
}

export const createHash = onRequest((request, response) => {
  const { text } = request.body
  if (typeof text !== 'string') {
    response
      .status(400)
      .send('Request body must be a JSON object with a "text" property of type string.')
    return
  }

  const hash = createHashFunc(text)
  response.send(hash)
})
