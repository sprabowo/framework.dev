import { Podcast } from "@framework/system/src/models/podcast"

export const podcastTags = [] as const

export const podcasts: Podcast<typeof podcastTags[number]>[] = []
