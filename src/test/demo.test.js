// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('playground', () => {
  it('renders the Vue demo and the vanilla core demo', async () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('vue3-emoji-picker')
    expect(wrapper.find('.v3-emoji-picker').exists()).toBe(true)
    expect(wrapper.find('.core-grid').exists()).toBe(true)

    await wrapper.findAll('.tabs button')[1].trigger('click')

    expect(wrapper.findAll('.tabs button')[1].classes()).toContain('active')
    expect(wrapper.find('.core-grid button').exists()).toBe(true)

    wrapper.unmount()
  })
})
