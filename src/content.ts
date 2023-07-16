import type { PlasmoCSConfig } from 'plasmo'

import { BskyClient } from '~libs/bskyClient'

export const config: PlasmoCSConfig = {
  matches: ['https://twitter.com/*'],
  all_frames: false
}

const twitterSyncBluesky = async (
  userId: string,
  password: string
): Promise<void> => {
  const agent: BskyClient = await BskyClient.createAgent(userId, password)

  let inlineTweetButton
  try {
    inlineTweetButton = (await getElement(
      '[data-testid="tweetButtonInline"]',
      'Inline Tweet button not found.'
    )) as HTMLInputElement

    appendSwitchSyncElement(inlineTweetButton)

    inlineTweetButton.onclick = createTweetHandler(agent, userId, password)
  } catch (e) {
    console.warn(e)
  }

  let sideBarTweetButton
  try {
    sideBarTweetButton = (await getElement(
      '[data-testid="SideNav_NewTweet_Button"]',
      'Side bar Tweet button not found.'
    )) as HTMLInputElement

    sideBarTweetButton.onclick = async () => {
      const tweetButton = (await getElement(
        '[data-testid="toolBar"] [data-testid="tweetButton"]',
        'Tweet button not found.'
      )) as HTMLInputElement

      appendSwitchSyncElement(tweetButton)

      tweetButton.onclick = createTweetHandler(agent, userId, password)
    }
  } catch (e) {
    console.warn(e)
  }
}

const createTweetHandler = (
  agent: BskyClient,
  userId: string,
  password: string
): (() => void) => {
  return () => {
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

      void twitterSyncBluesky(userId, password)
    }
  }
}

const getElement = async (
  selector: string,
  errorMsg: string,
  node: Document = document,
  timeout: number = 200
): Promise<Element | null> => {
  try {
    const element = await waitQuerySelector(selector, node, timeout)
    if (element == null) {
      throw new Error(errorMsg)
    }
    return element as HTMLInputElement
  } catch (e) {
    console.warn(e)
    return null
  }
}

const getElementParent = (element: Element): Element => {
  const parent = element.parentElement
  if (parent == null) {
    throw new Error('parent element not found.')
  }
  return parent
}

const appendSwitchSyncElement = (element: Element): void => {
  const parentElement = getElementParent(element)

  if (parentElement.querySelector('#SwitchSync') == null) {
    parentElement.insertAdjacentHTML(
      'afterbegin',
      `
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="SwitchSync" checked>
        <label class="form-check-label text-light" for="SwitchSync">Sync Bsky</label>
      </div>
    `
    )
  }
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
      twitterSyncBluesky(message.body.userId, message.body.password)
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
