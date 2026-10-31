// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Picker from '../components/Picker.vue'

const mountPicker = (props = {}, attach = false) =>
  mount(Picker, {
    props,
    ...(attach ? { attachTo: document.body } : {}),
  })

describe('prop reactivity', () => {
  it('re-renders when native changes after mount', async () => {
    const wrapper = mountPicker({ native: false })

    expect(wrapper.findAll('.v3-emojis img').length).toBeGreaterThan(0)

    await wrapper.setProps({ native: true })

    expect(wrapper.findAll('.v3-emojis img').length).toBe(0)
    expect(wrapper.findAll('.v3-emojis button > span').length).toBeGreaterThan(
      0
    )

    wrapper.unmount()
  })

  it('re-renders when the theme changes after mount', async () => {
    const wrapper = mountPicker({ theme: 'light' })

    expect(wrapper.find('.v3-emoji-picker').classes()).toContain(
      'v3-color-theme-light'
    )

    await wrapper.setProps({ theme: 'dark' })

    expect(wrapper.find('.v3-emoji-picker').classes()).toContain(
      'v3-color-theme-dark'
    )

    wrapper.unmount()
  })

  it('switches to input mode when pickerType changes after mount', async () => {
    const wrapper = mountPicker({ pickerType: '' })

    expect(wrapper.find('.v3-emoji-picker-input').exists()).toBe(false)

    await wrapper.setProps({ pickerType: 'input' })

    expect(wrapper.find('.v3-emoji-picker-input').exists()).toBe(true)

    wrapper.unmount()
  })

  it('applies a custom group name', async () => {
    const wrapper = mountPicker({
      groupNames: { smileys_people: 'Faces' },
      hideGroupNames: false,
    })

    expect(wrapper.text()).toContain('Faces')

    wrapper.unmount()
  })

  it('honours disabled groups', async () => {
    const wrapper = mountPicker({ disabledGroups: ['flags'] })

    expect(wrapper.find('#flags').exists()).toBe(false)
    expect(wrapper.find('#smileys_people').exists()).toBe(true)

    wrapper.unmount()
  })
})

describe('new props', () => {
  it('hides the footer', () => {
    const wrapper = mountPicker({ hideFooter: true })
    expect(wrapper.find('.v3-footer').exists()).toBe(false)
    wrapper.unmount()
  })

  it('hides individual emoji', () => {
    const wrapper = mountPicker({ native: true, disabledEmojis: ['1f600'] })
    const body = wrapper.find('.v3-body').text()
    expect(body).not.toContain('\u{1f600}')
    expect(body).toContain('\u{1f601}')
    wrapper.unmount()
  })

  it('passes input attributes through to the input', () => {
    const wrapper = mountPicker({
      pickerType: 'textarea',
      inputAttrs: { placeholder: 'Say hi', rows: 3, class: 'my-input' },
    })
    const textarea = wrapper.find('textarea')

    expect(textarea.attributes('placeholder')).toBe('Say hi')
    expect(textarea.attributes('rows')).toBe('3')
    expect(textarea.classes()).toEqual(
      expect.arrayContaining(['my-input', 'v3-emoji-picker-textarea'])
    )
    wrapper.unmount()
  })

  it('lazy-loads emoji images', () => {
    const wrapper = mountPicker({ native: false })
    const img = wrapper.find('.v3-emojis img')
    // happy-dom may set it as a DOM property instead of an attribute.
    expect(img.attributes('loading') || img.element.loading).toBe('lazy')
    wrapper.unmount()
  })
})

describe('image sets', () => {
  it('uses the selected emoji-datasource set', () => {
    const wrapper = mountPicker({ set: 'twitter' })
    expect(wrapper.find('.v3-emojis img').attributes('src')).toContain(
      'emoji-datasource-twitter'
    )
    wrapper.unmount()
  })

  it('prefers a custom imageUrl resolver', async () => {
    const wrapper = mountPicker({ imageUrl: (u) => `/emoji/${u}.svg` })
    expect(wrapper.find('.v3-emojis img').attributes('src')).toMatch(
      /^\/emoji\/[0-9a-f-]+\.svg$/
    )

    await wrapper.setProps({ imageUrl: (u) => `/v2/${u}.png` })
    expect(wrapper.find('.v3-emojis img').attributes('src')).toMatch(/^\/v2\//)
    wrapper.unmount()
  })

  it('renders custom emoji from their own src, even in native mode', () => {
    const wrapper = mountPicker({
      native: true,
      additionalGroups: {
        custom: [{ n: ['parrot', 'party_parrot'], u: 'parrot', src: '/p.gif' }],
      },
    })
    expect(wrapper.find('#custom img').attributes('src')).toBe('/p.gif')
    wrapper.unmount()
  })
})

describe('layout and texts', () => {
  it('exposes perLine and emojiSize as CSS variables', () => {
    const wrapper = mountPicker({ perLine: 10, emojiSize: 28 })
    const style = wrapper.find('.v3-emoji-picker').attributes('style')
    expect(style).toContain('--v3-per-line: 10')
    expect(style).toContain('--v3-emoji-size: 28px')
    wrapper.unmount()
  })

  it('shows a configurable no-results message', async () => {
    const wrapper = mountPicker({ staticTexts: { noResults: 'Nada' } })
    await wrapper.find('.v3-search input').setValue('zzzzqqq')
    expect(wrapper.find('.v3-no-result').text()).toBe('Nada')
    wrapper.unmount()
  })
})

describe('keyboard navigation', () => {
  const focused = () => document.activeElement

  it('keeps a single tab stop in the grid', () => {
    const wrapper = mountPicker({ native: true })
    const tabbable = wrapper.findAll('.v3-emojis button[tabindex="0"]')
    expect(tabbable).toHaveLength(1)
    wrapper.unmount()
  })

  it('moves with arrow keys and respects perLine', async () => {
    const wrapper = mountPicker({ native: true, perLine: 8 }, true)
    const first = wrapper.find('button[data-g="0"][data-i="0"]')
    first.element.focus()

    await first.trigger('keydown', { key: 'ArrowRight' })
    expect(focused().dataset.i).toBe('1')

    await wrapper
      .find('button[data-g="0"][data-i="1"]')
      .trigger('keydown', { key: 'ArrowDown' })
    expect(focused().dataset.i).toBe('9')
    expect(
      wrapper.find('button[data-g="0"][data-i="9"]').attributes('tabindex')
    ).toBe('0')
    wrapper.unmount()
  })

  it('moves from search into the grid and selects with Enter', async () => {
    const wrapper = mountPicker({ native: true }, true)
    const input = wrapper.find('.v3-search input')

    await input.setValue('thumbsup')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')[0][0].u).toBe('1f44d')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(focused().getAttribute('aria-label')).toBe('thumbs up')
    wrapper.unmount()
  })

  it('focuses the search input with autoFocus', () => {
    const wrapper = mountPicker({ autoFocus: true }, true)
    expect(focused()).toBe(wrapper.find('.v3-search input').element)
    wrapper.unmount()
  })
})
