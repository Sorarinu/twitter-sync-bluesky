import type { PlasmoCSConfig } from 'plasmo'

import { BskyClient } from '~libs/bskyClient'

export const config: PlasmoCSConfig = {
  matches: ['https://twitter.com/*'],
  all_frames: false
}

let twitterSyncBlueskyExecuted = false

const twitterSyncBluesky = async ({
  userId,
  password
}: {
  userId: string
  password: string
}): Promise<void> => {
  if (twitterSyncBlueskyExecuted) return

  const agent: BskyClient = await BskyClient.createAgent(userId, password)

  const sideBarTweetButton = document.querySelector(
    '[data-testid="SideNav_NewTweet_Button"]'
  )

  if (sideBarTweetButton == null) {
    console.error('Side bar Tweet button not found.')
    return
  }

  sideBarTweetButton.addEventListener('click', () => {
    void syncTweetToBsky(agent)
  })

  twitterSyncBlueskyExecuted = true
}

const syncTweetToBsky = async (agent: BskyClient): Promise<void> => {
  const tweetButton = await waitQuerySelector(
    '[data-testid="toolBar"] [data-testid="tweetButton"]'
  )

  if (tweetButton == null) {
    console.error('Tweet button not found.')
    return
  }

  const tweetButtonParentElement = tweetButton.parentElement

  if (tweetButtonParentElement == null) {
    console.error('Tweet button parent element not found.')
    return
  }

  if (tweetButtonParentElement.querySelector('#SwitchSync') == null) {
    tweetButtonParentElement.insertAdjacentHTML(
      'afterbegin',
      `
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" id="SwitchSync" checked>
    <label class="form-check-label text-light" for="SwitchSync">Sync Bsky</label>
  </div>
  `
    )
  }

  tweetButton.addEventListener('click', () => {
    const isSync =
      (document.querySelector('#SwitchSync') as HTMLInputElement)?.checked ||
      false

    if (isSync) {
      const text = (
        document.querySelector(
          '[data-testid="tweetTextarea_0"]'
        ) as HTMLInputElement
      )?.innerText

      void agent.post(text)
    }
  })
}

const waitQuerySelector = async (
  selector: string,
  node: Document = document,
  timeout: number = 3000
): Promise<Element> => {
  return await new Promise((resolve, reject) => {
    let timeElapsed = 1
    const interval = 100

    const checker = setInterval(() => {
      const element = node.querySelector(selector)
      timeElapsed += interval

      if (element != null) {
        clearInterval(checker)
        resolve(element)
      }

      if (timeElapsed >= timeout) {
        clearInterval(checker)
        reject(new Error('Timeout when waiting for element'))
      }
    }, interval)
  })
}

chrome.runtime.onMessage.addListener(
  (
    message: { name: string; body: { userId: string; password: string } },
    _,
    sendResponse
  ) => {
    if (message.name === 'twitter-sync-bluesky') {
      twitterSyncBluesky({
        userId: message.body.userId,
        password: message.body.password
      })
        .then(() => {
          sendResponse({ hasError: false })
        })
        .catch((e) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          sendResponse({ hasError: true, message: e.toString() })
        })

      return true
    }
    return false
  }
)

// Twitter の UI で bootstrap が利用できるようにする
window.addEventListener('load', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    `
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
  `
  )
})
