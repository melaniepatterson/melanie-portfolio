// Drop-in async replacements for window.confirm()/alert() that render
// GlowUp's own themed dialog instead of the native browser one.
//
//   const [confirmDialog, confirm] = useConfirm()
//   ...
//   onClick={async () => { if (await confirm({ title, message })) doThing() }}
//   ...
//   return <>{confirmDialog}...</>
import { useCallback, useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

export function useConfirm() {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((opts) => {
    setState(opts)
    return new Promise(resolve => { resolver.current = resolve })
  }, [])

  function resolve(result) {
    resolver.current?.(result)
    setState(null)
  }

  const element = state && (
    <ConfirmDialog
      open
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      danger={state.danger !== false}
      onConfirm={() => resolve(true)}
      onCancel={() => resolve(false)}
    />
  )

  return [element, confirm]
}

// Same idea for alert() — single-button acknowledgement, no cancel path.
export function useAlert() {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const alertUser = useCallback((message, title = 'Heads up') => {
    setState({ message, title })
    return new Promise(resolve => { resolver.current = resolve })
  }, [])

  function dismiss() {
    resolver.current?.()
    setState(null)
  }

  const element = state && (
    <ConfirmDialog
      open
      title={state.title}
      message={state.message}
      confirmLabel="OK"
      danger={false}
      onConfirm={dismiss}
    />
  )

  return [element, alertUser]
}
