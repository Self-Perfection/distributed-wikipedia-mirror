import cheerio from 'cheerio'
import { readFileSync, writeFileSync } from 'fs'
import { relative } from 'path'

import {
  appendFooter,
  appendHtmlPostfix,
  replaceANamespaceWithWiki,
  reworkLinks
} from './article-transforms'
import { Directories, EnhancedOpts, Options } from './domain'

export const processArticle = (
  filepath: string,
  { wikiFolder, imagesFolder }: Directories,
  options: Options
) => {
  const htmlBuffer = readFileSync(filepath)
  const html = htmlBuffer.toString()

  if (html.trim() === '') {
    return
  }

  const $html = cheerio.load(html)

  const canonicalUrl = $html('link[rel="canonical"]').attr('href')

  if (!canonicalUrl) {
    throw new Error(`Could not parse out canonical url for ${canonicalUrl}`)
  }

  const enhancedOpts: EnhancedOpts = Object.assign(options, {
    snapshotDate: new Date(),
    relativeFilepath: relative(wikiFolder, filepath),
    relativeImagePath: relative(filepath, imagesFolder).replace('../', ''),
    canonicalUrl
  })

  reworkLinks($html, 'a:not(.external)', [
    replaceANamespaceWithWiki,
    appendHtmlPostfix
  ])

  appendFooter($html, enhancedOpts)

  writeFileSync(filepath, $html.html())
}
