// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Picker from '../components/Picker.vue'

const mountPicker = (props = {}) => mount(Picker, { props })

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
