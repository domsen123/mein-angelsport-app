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
    table: {
      slots: {
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0',
      },
    },
  },
})
