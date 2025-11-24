export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'rounded-tr-none rounded-bl-none cursor-pointer',
      },
    },
    input: {
      slots: {
        base: 'rounded-none',
      },
    },
    form: {
      base: 'space-y-4',
    },
    formField: {
      slots: {
        help: 'mt-0 text-muted text-sm',
      },
    },
  },
})
