import 'h3' // Import h3 to ensure declaration merging
import type { userJWTPayload } from '#shared/types'

declare module 'h3' {
  interface H3EventContext {
    // Add your custom properties here
    auth?: {
      user?: userJWTPayload | null
    }
  }
}

export default {}
