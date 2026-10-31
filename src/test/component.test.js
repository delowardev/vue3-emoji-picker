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
  it('re-renders when set changes to native after mount', async () => {
    const wrapper = mountPicker({ set: 'apple' })

    expect(wrapper.findAll('.v3-emojis img').length).toBeGreaterThan(0)

    await wrapper.setProps({ set: 'native' })

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

  it('switches to input mode when type changes after mount', async () => {
    const wrapper = mountPicker({ type: 'inline' })

    expect(wrapper.find('.v3-emoji-picker-input').exists()).toBe(false)

    await wrapper.setProps({ type: 'input' })

    expect(wrapper.find('.v3-emoji-picker-input').exists()).toBe(true)

    wrapper.unmount()
  })

  it('applies a custom group name', async () => {
    const wrapper = mountPicker({
      i18n: { categories: { smileys_people: 'Faces' } },
    })

    expect(wrapper.text()).toContain('Faces')

    wrapper.unmount()
  })

  it('shows only the listed categories', async () => {
    const wrapper = mountPicker({
      categories: ['smileys_people', 'animals_nature'],
    })

    expect(wrapper.find('#flags').exists()).toBe(false)
    expect(wrapper.find('#smileys_people').exists()).toBe(true)

    wrapper.unmount()
  })
})

describe('new props', () => {
  it('hides the footer when preview and skin tones are off', () => {
    const wrapper = mountPicker({
      previewPosition: 'none',
      skinTonePosition: 'none',
    })
    expect(wrapper.find('.v3-footer').exists()).toBe(false)
    wrapper.unmount()
  })

  it('hides individual emoji', () => {
    const wrapper = mountPicker({ set: 'native', excludeEmojis: ['1f600'] })
    const body = wrapper.find('.v3-body').text()
    expect(body).not.toContain('\u{1f600}')
    expect(body).toContain('\u{1f601}')
    wrapper.unmount()
  })

  it('passes input attributes through to the input', () => {
    const wrapper = mountPicker({
      type: 'textarea',
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
    const wrapper = mountPicker({ set: 'apple' })
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
      set: 'native',
      customCategories: [
        {
          key: 'custom',
          emojis: [{ name: 'parrot', unicode: 'parrot', src: '/p.gif' }],
        },
      ],
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
    // The rest of the interface scales with the emoji size (28 / 22).
    expect(style).toMatch(/--v3-auto-scale: 1\.27/)
    wrapper.unmount()
  })

  it('shows a configurable no-results message', async () => {
    const wrapper = mountPicker({ i18n: { noResults: 'Nada' } })
    await wrapper.find('.v3-search input').setValue('zzzzqqq')
    expect(wrapper.find('.v3-no-result').text()).toBe('Nada')
    wrapper.unmount()
  })
})

describe('keyboard navigation', () => {
  const focused = () => document.activeElement

  it('keeps a single tab stop in the grid', () => {
    const wrapper = mountPicker({ set: 'native' })
    const tabbable = wrapper.findAll('.v3-emojis button[tabindex="0"]')
    expect(tabbable).toHaveLength(1)
    wrapper.unmount()
  })

  it('moves with arrow keys and respects perLine', async () => {
    const wrapper = mountPicker({ set: 'native', perLine: 8 }, true)
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
    const wrapper = mountPicker({ set: 'native' }, true)
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
