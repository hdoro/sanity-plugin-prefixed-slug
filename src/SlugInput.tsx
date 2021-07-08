import React from 'react'
import speakingurl from 'speakingurl'
import {TextInput, Button, Flex, Box, Card, Stack, ThemeProvider, studioTheme} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {ChangeIndicatorCompareValueProvider} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {withDocument, withValuePath} from 'part:@sanity/form-builder'
import PatchEvent, {set, unset} from 'part:@sanity/form-builder/patch-event'
import DefaultFormField from 'part:@sanity/components/formfields/default'

const createPatchFrom = (value: any) => PatchEvent.from(value === '' ? unset() : set(value))

function getNewFromSource(source: string | Function, valuePath: any[], document: any) {
  const parentPath = valuePath.slice(0, -1)
  const parent = PathUtils.get(document, parentPath)
  return Promise.resolve(
    typeof source === 'function'
      ? source(document, {parentPath, parent})
      : (PathUtils.get(document, source) as string | undefined)
  )
}

/**
 * Custom slug component for better UX & safer slugs:
 * - shows the final URL for the relative address (adds the BASE.PATH/ at the start)
 * - removes special characters and startin/trailing slashes
 */
class SlugInput extends React.Component<
  any,
  {
    basePath: string | undefined
  }
> {
  inputRef: React.RefObject<any>

  constructor(props: any) {
    super(props)
    this.inputRef = React.createRef()
    this.state = {
      basePath: undefined,
    }
  }

  focus = () => {
    if (this.inputRef && this.inputRef.current) {
      this.inputRef.current.focus()
    }
  }

  updateValue = (strValue: string) => {
    const patchValue = {_type: this.props.type?.name || 'slug', current: strValue}
    this.props.onChange(createPatchFrom(patchValue))
  }

  /**
   * Avoids trailing slashes, double slashes, spaces, special characters and uppercase letters
   */
  formatSlug = (input?: React.FocusEventHandler<HTMLInputElement> | string) => {
    const customValue = typeof input === 'string' ? input : undefined
    let finalSlug = customValue || this.props.value?.current || ''
    // Option that can be passed to this input component to format values on input
    const customSlugify = this.props.type.options?.slugify
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
        .map((segment: string) => speakingurl(segment, {symbols: true}))
        .join('/')
    }

    // Finally, save this final slug to the document
    this.updateValue(finalSlug)
  }

  componentDidMount() {
    const {type, document} = this.props
    const options = type.options as {basePath?: string | Function | Promise<unknown>}

    const getBasePath = async (): Promise<string | undefined> => {
      if (typeof options?.basePath === 'string') {
        return options.basePath
      }
      if (typeof options?.basePath === 'function') {
        try {
          const value = await Promise.resolve(options.basePath(document))
          return value
        } catch (error) {
          console.error(error)
          return undefined
        }
      }
      return undefined
    }

    getBasePath().then((basePath) => {
      if (basePath) {
        this.setState({basePath})
      }
    })
  }

  generateSlug = async () => {
    const {document, type} = this.props
    const newSlug = await getNewFromSource(
      type.options?.source,
      this.props.getValuePath(),
      document
    )
    this.formatSlug(newSlug)
  }

  render() {
    const {value, type, compareValue} = this.props

    return (
      <ThemeProvider theme={studioTheme}>
        <ChangeIndicatorCompareValueProvider
          value={value?.current}
          compareValue={compareValue?.current}
        >
          <DefaultFormField
            label={type.title || type.name}
            description={type.description}
            level={this.props.level}
            // Necessary for validation warnings to show up contextually
            markers={this.props.markers}
            // Necessary for presence indication
            presence={this.props.presence}
          >
            <Stack space={3}>
              <Flex>
                {this.state.basePath && (
                  <Card
                    border={true}
                    padding={1}
                    radius={2}
                    flex={1}
                    style={{
                      maxWidth: 'min-content',
                      height: '35px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      alignItems: 'center',
                      backgroundColor: '#f1f3f6',
                      marginRight: '-1px',
                      paddingRight: '0.75rem',
                      paddingLeft: '0.75rem',
                      color: '--card-code-fg-color',
                      fontSize: '1rem',
                      lineHeight: '1.3125',
                      borderTopRightRadius: '0',
                      borderBottomRightRadius: '0',
                      boxSizing: 'border-box',
                    }}
                    display="flex"
                  >{`${this.state.basePath}/`}</Card>
                )}
                <Box flex={2}>
                  <TextInput
                    onChange={(event: any) => this.updateValue(event.target.value)}
                    onBlur={this.formatSlug}
                    value={value?.current || ''}
                    readOnly={this.props.readOnly}
                  />
                </Box>
                {type.options?.source && (
                  <Box marginLeft={1}>
                    <Button
                      mode="ghost"
                      type="button"
                      disabled={this.props.readOnly}
                      onClick={this.generateSlug}
                      text={'Generate'}
                    />
                  </Box>
                )}
              </Flex>
            </Stack>
          </DefaultFormField>
        </ChangeIndicatorCompareValueProvider>
      </ThemeProvider>
    )
  }
}

export default withValuePath(withDocument(SlugInput))
