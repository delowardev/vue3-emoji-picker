export default {
  native: {
    type: Boolean,
    default: false,
  },
  hideSearch: {
    type: Boolean,
    default: false,
  },
  hideGroupIcons: {
    type: Boolean,
    default: false,
  },
  hideGroupNames: {
    type: Boolean,
    default: false,
  },
  staticTexts: {
    type: Object,
    default: () => ({}),
  },
  disableStickyGroupNames: {
    type: Boolean,
    default: false,
  },
  disabledGroups: {
    type: Array,
    default: () => [],
  },
  groupNames: {
    type: Object,
    default: () => ({}),
  },
  disableSkinTones: {
    type: Boolean,
    default: false,
  },
}
