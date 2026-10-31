// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Picker from '../components/Picker.vue'
import { legacyToOptions, resetDeprecationWarnings } from '../compat'

let warn

beforeEach(() => {
  resetDeprecationWarnings()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

const warnings = () => warn.mock.calls.map(([message]) => message)

describe('1.x props', () => {
  it('translate to 2.x options', () => {
    const options = legacyToOptions(
      {
        native: true,
        hideSearch: true,
        hideGroupIcons: true,
        disableStickyGroupNames: true,
        disableSkinTones: true,
        staticTexts: { placeholder: 'Find', skinTone: 'Tone' },
        groupNames: { flags: 'Banderas' },
        groupOrder: ['flags'],
        disabledGroups: ['symbols'],
        additionalGroups: { team: [{ n: ['x'], u: 'x' }] },
        groupIcons: { team: '/t.svg' },
        displayRecent: true,
        pickerType: 'textarea',
        mode: 'insert',
      },
      () => {}
    )

    expect(options).toEqual({
      set: 'native',
      searchPosition: 'none',
      navPosition: 'none',
      categoryHeaders: 'static',
      skinTonePosition: 'none',
      i18n: {
        search: 'Find',
        skinTone: 'Tone',
        categories: { flags: 'Banderas' },
      },
      customCategories: [{ key: 'team', emojis: [{ n: ['x'], u: 'x' }] }],
      categories: [
        'flags',
        'team',
        'recent',
        'smileys_people',
        'animals_nature',
        'food_drink',
        'activities',
        'travel_places',
        'objects',
      ],
      categoryIcons: { team: '/t.svg' },
      recent: 'recent',
      type: 'textarea',
      insertMode: 'caret',
    })
  })

  it('still render as before and warn once per prop', async () => {
    const wrapper = mount(Picker, {
      props: { native: true, hideGroupNames: true, disabledGroups: ['flags'] },
    })

    expect(wrapper.find('.v3-emojis img').exists()).toBe(false)
    expect(wrapper.find('.v3-body h5').exists()).toBe(false)
    expect(wrapper.find('#flags').exists()).toBe(false)

    await wrapper.setProps({ native: false })
    mount(Picker, { props: { native: true } }).unmount()

    const messages = warnings()
    expect(messages.filter((m) => m.includes('"native"'))).toHaveLength(1)
    expect(messages.find((m) => m.includes('"native"'))).toContain(
      'set="native"'
    )
    expect(messages.some((m) => m.includes('"hide-group-names"'))).toBe(true)
    expect(messages.some((m) => m.includes('UPGRADE.md'))).toBe(true)
    wrapper.unmount()
  })

  it('let 2.x props win over 1.x props', () => {
    const wrapper = mount(Picker, { props: { native: true, set: 'twitter' } })
    expect(wrapper.find('.v3-emojis img').attributes('src')).toContain(
      'twitter'
    )
    wrapper.unmount()
  })

  it('keep v-model:text working and emit update:modelValue too', async () => {
    const wrapper = mount(Picker, {
      props: { pickerType: 'input', text: 'hi', set: 'native' },
    })
    const input = wrapper.find('input.v3-emoji-picker-input')
    expect(input.element.value).toBe('hi')

    await input.setValue('hey')
    expect(wrapper.emitted('update:text').at(-1)).toEqual(['hey'])
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['hey'])
    expect(warnings().some((m) => m.includes('"text"'))).toBe(true)
    wrapper.unmount()
  })

  it('do not warn when only 2.x props are used', () => {
    const wrapper = mount(Picker, {
      props: {
        set: 'native',
        type: 'input',
        modelValue: 'x',
        recent: 'recent',
      },
    })
    expect(warn).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('v-model', () => {
  it('is controlled through modelValue', async () => {
    const wrapper = mount(Picker, {
      props: { type: 'input', modelValue: 'a', set: 'native' },
    })
    const input = wrapper.find('input.v3-emoji-picker-input')

    await wrapper.setProps({ modelValue: '' })
    expect(input.element.value).toBe('')
    wrapper.unmount()
  })
})
