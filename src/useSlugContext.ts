// Provides the context needed for usePrefixLogic.
// Adapted from:
// https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/core/form/inputs/Slug/utils/useSlugContext.ts

import { SlugSourceContext } from '@sanity/types'
import { useMemo } from 'react'
import { useCurrentUser, useDataset, useProjectId, useSchema, useSource } from 'sanity'

/**
 * @internal
 */
export type SlugContext = Omit<SlugSourceContext, 'parent' | 'parentPath'>

/**
 * @internal
 */
export function useSlugContext(): SlugContext {
  const { getClient } = useSource()
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const projectId = useProjectId()
  const dataset = useDataset()

  return useMemo(() => {
    return {
      projectId,
      dataset,
      getClient,
      schema,
      currentUser,
    }
  }, [getClient, schema, currentUser, projectId, dataset])
}
