import * as PathUtils from '@sanity/util/paths'
import React, { useCallback, useEffect, useState } from 'react'
import { PatchEvent, SanityDocument, set, SlugInputProps, unset, useFormValue } from 'sanity'
import speakingurl from 'speakingurl'
import { useSlugContext } from './useSlugContext'

const createPatchFrom = (value: any) => PatchEvent.from(value ? set(value) : unset())

// eslint-disable-next-line
export function usePrefixLogic(props: SlugInputProps) {
  const { schemaType } = props
  const sourceContext = useSlugContext()
  const document = useFormValue([]) as SanityDocument | undefined
  const [urlPrefix, setUrlPrefix] = useState<string | undefined>()
  const options = schemaType.options as SlugInputProps['schemaType']['options'] & {
    urlPrefix?: string | Function | Promise<unknown>
  }

  const getUrlPrefix = useCallback(
    async (doc: SanityDocument | undefined) => {
      if (!doc) return

      if (typeof options?.urlPrefix === 'string') {
        setUrlPrefix(options.urlPrefix)
        return
      }

      if (typeof options?.urlPrefix === 'function') {
        try {
          const value = await Promise.resolve(options.urlPrefix(doc))
          setUrlPrefix(value)
          return
        } catch (error) {
          console.error(`[prefixed-slug] Couldn't generate URL prefix: `, error)
        }
      }

      setUrlPrefix(undefined)
    },
    // eslint-disable-next-line
    [setUrlPrefix, options.urlPrefix],
  )

  // Re-create the prefix whenever the document changes
  useEffect(() => {
    getUrlPrefix(document)
  }, [document, getUrlPrefix])

  function updateValue(strValue: string) {
    const patch = createPatchFrom(
      strValue
        ? {
            _type: schemaType?.name || 'slug',
            current: strValue,
          }
        : undefined,
    )

    props.onChange(patch)
  }

  async function generateSlug() {
    if (!document) return

    const parentPath = props.path.slice(0, -1)
    const parent = PathUtils.get(document, parentPath) as any
    const sourceValue = await Promise.resolve(
      typeof options?.source === 'function'
        ? (options?.source(document, { parentPath, parent, ...sourceContext }) as
            | string
            | undefined)
        : (PathUtils.get(document, options?.source || []) as string | undefined),
    )
    formatSlug(sourceValue)
  }

  /**
   * Avoids trailing slashes, double slashes, spaces, special characters and uppercase letters
   */
  async function formatSlug(input?: React.FocusEventHandler<HTMLInputElement> | string) {
    const customValue = typeof input === 'string' ? input : undefined
    let finalSlug = customValue || props.value?.current || ''
    // Option that can be passed to this input component to format values on input
    const customSlugify = schemaType.options?.slugify
    if (customSlugify) {
      finalSlug = await Promise.resolve(customSlugify(finalSlug || '', schemaType, {} as any))
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
