import * as PathUtils from '@sanity/util/paths'
import PatchEvent, { set, unset } from 'part:@sanity/form-builder/patch-event'
import React, { useEffect, useState } from 'react'
import speakingurl from 'speakingurl'

const createPatchFrom = (value: any) =>
  PatchEvent.from(value === '' ? unset() : set(value))

export function usePrefixLogic(props: any) {
  const { type, document } = props
  const [urlPrefix, setUrlPrefix] = useState<string | undefined>()
  const options = type.options as {
    urlPrefix?: string | Function | Promise<unknown>
  }

  useEffect(() => {
    const getUrlPrefix = async (): Promise<string | undefined> => {
      if (typeof options?.urlPrefix === 'string') {
        return options.urlPrefix
      }
      if (typeof options?.urlPrefix === 'function') {
        try {
          const value = await Promise.resolve(options.urlPrefix(document))
          return value
        } catch (error) {
          console.error(error)
          return undefined
        }
      }
      return undefined
    }

    getUrlPrefix().then(setUrlPrefix)
  }, [])

  function updateValue(strValue: string) {
    const patchValue = {
      _type: props.type?.name || 'slug',
      current: strValue,
    }
    props.onChange(createPatchFrom(patchValue))
  }

  async function generateSlug() {
    const parentPath = props.getValuePath().slice(0, -1)
    const parent = PathUtils.get(document, parentPath)

    const sourceValue = await Promise.resolve(
      typeof type.options?.source === 'function'
        ? (type.options?.source(document, { parentPath, parent }) as
            | string
            | undefined)
        : (PathUtils.get(document, type.options?.source) as string | undefined),
    )
    formatSlug(sourceValue)
  }

  /**
   * Avoids trailing slashes, double slashes, spaces, special characters and uppercase letters
   */
  function formatSlug(
    input?: React.FocusEventHandler<HTMLInputElement> | string,
  ) {
    const customValue = typeof input === 'string' ? input : undefined
    let finalSlug = customValue || props.value?.current || ''
    // Option that can be passed to this input component to format values on input
    const customSlugify = props.type.options?.slugify
    if (customSlugify) {
      finalSlug = customSlugify(finalSlug || '')
    } else {
      // Removing special characters, spaces, uppercase letters, etc.
      finalSlug = finalSlug
        // As we want to allow slashes between segments (segment-1/segment-2)
        // We're splitting the string to preserve these slashes
        .split('/')
        // If a segment is empty, this means a starting or trailing slash, or double slashes, which we want to get rid of
        .filter((segment: string | undefined) => !!segment)
        .map((segment: string) => speakingurl(segment, { symbols: true }))
        .join('/')
    }

    // Finally, save this final slug to the document
    updateValue(finalSlug)
  }

  return {
    urlPrefix,
    generateSlug,
    updateValue,
    formatSlug,
  }
}
