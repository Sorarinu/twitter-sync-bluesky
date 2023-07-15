import { BskyAgent, RichText } from '@atproto/api'

export class BskyClient {
  agent: BskyAgent
  private constructor() {
    this.agent = new BskyAgent({ service: 'https://bsky.social' })
  }

  public static async createAgent(
    userId: string,
    password: string
  ): Promise<BskyClient> {
    const client = new BskyClient()
    await client.agent.login({ identifier: userId, password })

    return client
  }

  public post = async (
    body: string
  ): Promise<{
    uri: string
    cid: string
  }> => {
    const ritchText = new RichText({ text: body })
    await ritchText.detectFacets(this.agent)

    return await this.agent.post({ text: body, fasets: ritchText.facets })
  }
}
