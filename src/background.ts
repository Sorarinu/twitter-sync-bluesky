import { sendToContentScript } from '@plasmohq/messaging'
import { SecureStorage } from '@plasmohq/storage/secure'

import { STORAGE_KEY, UUID } from '~libs/constants'

const initialize = async (): Promise<void> => {
  const storage = new SecureStorage()

  await storage.setPassword(UUID)

  const userId = await storage.get(STORAGE_KEY.USER_ID)
  const password = await storage.get(STORAGE_KEY.PASSWORD)

  await sendToContentScript({
    name: 'twitter-sync-bluesky',
    body: { userId, password }
  })
}

chrome.tabs.onUpdated.addListener(
  (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) => {
    if (
      changeInfo.status === 'complete' &&
      (tab.url?.includes('https://twitter.com/') ?? false)
    ) {
      void initialize()
    }
  }
)
