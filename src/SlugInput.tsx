import { ChangeIndicatorCompareValueProvider } from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {
  Box,
  Button,
  Card,
  Code,
  Flex,
  Text,
  TextInput,
  Tooltip,
} from '@sanity/ui'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import { withDocument, withValuePath } from 'part:@sanity/form-builder'
import React from 'react'
import styled from 'styled-components'
import { usePrefixLogic } from './usePrefixLogic'

const UrlPrefix = styled(Card)`
  flex: 0 1 min-content;

  pre {
    padding: 1em 0;
  }

  pre,
  code {
    overflow-x: hidden;
    white-space: nowrap;
    max-width: 30ch;
    text-overflow: ellipsis;
  }

  // When no generate button is available, make it bigger
  &[data-no-generate='true'] {
    pre,
    code {
      max-width: 35ch;
    }
  }
`

/**
 * Custom slug component for better UX & safer slugs:
 * - shows the final URL for the relative address (adds the BASE.PATH/ at the start)
 * - removes special characters and startin/trailing slashes
 */
const SlugInput = React.forwardRef((props: any, ref) => {
  const { value, type, compareValue } = props
  const { urlPrefix, generateSlug, updateValue, formatSlug } =
    usePrefixLogic(props)

  const finalPrefix = `${urlPrefix}${urlPrefix?.endsWith('/') ? '' : '/'}`
  return (
    <ChangeIndicatorCompareValueProvider
      value={value?.current}
      compareValue={compareValue?.current}
    >
      <DefaultFormField
        label={type.title || type.name}
        description={type.description}
        level={props.level}
        // Necessary for validation warnings to show up contextually
        markers={props.markers}
        // Necessary for presence indication
        presence={props.presence}
      >
        <Flex style={{ gap: '0.5em' }} align="center">
          {urlPrefix && (
            <Tooltip
              content={
                <Box padding={2}>
                  <Text>{finalPrefix}</Text>
                </Box>
              }
            >
              <UrlPrefix data-no-generate={!type.options?.source}>
                <Code size={1}>{finalPrefix}</Code>
              </UrlPrefix>
            </Tooltip>
          )}
          <Box flex={3}>
            <TextInput
              onChange={(event: any) => updateValue(event.target.value)}
              onBlur={formatSlug}
              value={value?.current || ''}
              readOnly={props.readOnly}
              ref={ref}
            />
          </Box>
          {type.options?.source && (
            <Button
              mode="ghost"
              type="button"
              disabled={props.readOnly}
              onClick={generateSlug}
              text={'Generate'}
            />
          )}
        </Flex>
      </DefaultFormField>
    </ChangeIndicatorCompareValueProvider>
  )
})

export default withValuePath(withDocument(SlugInput))
